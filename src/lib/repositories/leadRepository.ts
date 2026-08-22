// lib/repositories/leadRepository.ts
import {
  executeQuery,
  QueryBuilder,
  withTransaction,
} from "../helpers/db-helper";
import { getFileUrl } from "../helpers/file-helper";
import { RepositoryBase } from "../helpers/repository-base";

export interface Lead {
  lead_id: number;
  company_id: number;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  product_id: number | null;
  product_name: string | null;
  message: string | null;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  source: string;
  assigned_to: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_on: string;
  updated_on: string | null;
}

export class LeadRepository extends RepositoryBase {
  private companyId: string;

  constructor(companyId: string) {
    super();
    this.companyId = companyId;
  }

  // ── Create ──────────────────────────────────────────────────────────────
  async createLead(data: {
    name: string;
    phone: string;
    email?: string | null;
    company?: string | null;
    product_id?: number | null;
    product_name?: string | null;
    message?: string | null;
    source?: string;
    ip_address?: string | null;
    user_agent?: string | null;
  }) {
    try {
      return withTransaction(async (connection) => {
        const leadId = await new QueryBuilder("leads")
          .setConnection(connection)
          .insert({
            company_id: this.companyId,
            name: data.name,
            phone: data.phone,
            email: data.email ?? null,
            company_name: data.company ?? null,
            product_id: data.product_id ?? null,
            product_name: data.product_name ?? null,
            message: data.message ?? null,
            source: data.source ?? "website",
            status: "new",
            ip_address: data.ip_address ?? null,
            user_agent: data.user_agent ?? null,
          });

        if (!leadId) {
          return this.failure("Could not create lead.");
        }

        await new QueryBuilder("lead_activities")
          .setConnection(connection)
          .insert({
            lead_id: leadId,
            company_id: this.companyId,
            activity_type: "status_change",
            old_status: null,
            new_status: "new",
            note: `Lead captured via ${data.source ?? "website"}${data.product_name ? ` for ${data.product_name}` : ""}.`,
            created_by: null,
          });

        return this.success({ lead_id: leadId }, "Lead Created!");
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── List (with filters + pagination) ───────────────────────────────────
  async getLeadList({
    status,
    product_id,
    assigned_to,
    search,
    page = 1,
    limit = 20,
  }: {
    status?: string;
    product_id?: string;
    assigned_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const offset = (page - 1) * limit;

      let where = ` WHERE l.company_id = ? `;
      let params: any[] = [this.companyId];

      if (status) {
        where += ` AND l.status = ? `;
        params.push(status);
      }
      if (product_id) {
        where += ` AND l.product_id = ? `;
        params.push(product_id);
      }
      if (assigned_to) {
        where += ` AND l.assigned_to = ? `;
        params.push(assigned_to);
      }
      if (search) {
        where += ` AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?) `;
        const like = `%${search}%`;
        params.push(like, like, like);
      }

      const countRes = (await executeQuery(
        `SELECT COUNT(*) AS total FROM leads l ${where}`,
        params,
      )) as any[];
      const total = countRes[0]?.total ?? 0;

      const sql = `
        SELECT
          l.*,
          u.name AS assigned_to_name,
          (
            SELECT COUNT(*) FROM lead_activities a WHERE a.lead_id = l.lead_id
          ) AS activity_count
        FROM leads l
        LEFT JOIN users u ON u.id = l.assigned_to
        ${where}
        ORDER BY l.created_on DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const items = (await executeQuery(sql, [...params])) as any[];

      return this.success({
        items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Single lead + its activity timeline ──────────────────────────────────
  // lib/repositories/leadRepository.ts
  async getLeadById(leadId: string) {
    try {
      let sql = `
        SELECT
          l.*,
          p.product_name AS live_product_name,
          p.product_slug AS product_slug,
          p.base_price AS product_base_price,
          p.sku AS product_sku,
          p.category_id AS product_category_id,
          p.status AS product_status,
          COALESCE(fl.identifier, fallback_fl.identifier) AS product_image
        FROM leads l
        LEFT JOIN products p
          ON p.product_id = l.product_id

        -- main image, matched by product_main_image -> file_log.id (this FK is fine, file_log.id is a real PK)
        LEFT JOIN file_log fl
          ON fl.id = p.product_main_image
          AND fl.status = 1
          AND fl.company_id = ?

        -- fallback: earliest product_image row for this product, via associated_type/associated_id
        LEFT JOIN file_log fallback_fl
          ON fallback_fl.id = (
                SELECT id
                FROM file_log
                WHERE associated_type = 'product_image'
                  AND associated_id = p.product_id
                  AND status = 1
                  AND company_id = ?
                ORDER BY id ASC
                LIMIT 1
          )

        WHERE l.lead_id = ?
          AND l.company_id = ?
        LIMIT 1
      `;

      const rows = (await executeQuery(sql, [
        this.companyId,
        this.companyId,
        leadId,
        this.companyId,
      ])) as any[];

      if (!rows || rows.length === 0) {
        return this.failure("Invalid Lead!");
      }

      const lead = rows[0];
      if (lead.product_image) {
        lead.product_image = getFileUrl(lead.product_image);
      }

      sql = `
        SELECT la.*,
            u.name, u.phone, r.role_name
          FROM lead_activities la
          LEFT JOIN users u ON u.id = la.created_by
          LEFT JOIN roles r ON r.id = u.role
          WHERE la.lead_id = ?
          ORDER BY la.created_on ASC
      `;
      const activities = await executeQuery(sql, [leadId]);

      lead.activities = activities;

      return this.success(lead);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Update status (logs the transition) ──────────────────────────────────
  async updateLeadStatus(
    leadId: string,
    newStatus: Lead["status"],
    userId: string,
    note?: string,
  ) {
    try {
      return withTransaction(async (connection) => {
        const lead = (await new QueryBuilder("leads")
          .setConnection(connection)
          .where("lead_id = ?", leadId)
          .where("company_id = ?", this.companyId)
          .selectOne()) as Lead;

        if (!lead) {
          return this.failure("Invalid Lead!");
        }

        const res = await new QueryBuilder("leads")
          .setConnection(connection)
          .where("lead_id = ?", leadId)
          .update({
            status: newStatus,
            updated_by: userId,
          });

        if (res <= 0) {
          return this.failure("Update Failed!");
        }

        await new QueryBuilder("lead_activities")
          .setConnection(connection)
          .insert({
            lead_id: leadId,
            company_id: this.companyId,
            activity_type: "status_change",
            old_status: lead.status,
            new_status: newStatus,
            note: note ?? null,
            created_by: userId,
          });

        return this.success("Lead Status Updated!");
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Assign to a team member ──────────────────────────────────────────────
  async assignLead(leadId: string, assignedTo: string, userId: string) {
    try {
      return withTransaction(async (connection) => {
        const res = await new QueryBuilder("leads")
          .setConnection(connection)
          .where("lead_id = ?", leadId)
          .where("company_id = ?", this.companyId)
          .update({
            assigned_to: assignedTo,
            updated_by: userId,
          });

        if (res <= 0) {
          return this.failure("Assignment Failed!");
        }

        await new QueryBuilder("lead_activities")
          .setConnection(connection)
          .insert({
            lead_id: leadId,
            company_id: this.companyId,
            activity_type: "assignment",
            note: `Assigned to user #${assignedTo}`,
            created_by: userId,
          });

        return this.success("Lead Assigned!");
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Add a free-form note / call log ──────────────────────────────────────
  async addLeadActivity(
    leadId: string,
    userId: string,
    activityType: "note" | "call" | "email",
    note: string,
  ) {
    try {
      const lead = await new QueryBuilder("leads")
        .where("lead_id = ?", leadId)
        .where("company_id = ?", this.companyId)
        .selectOne();

      if (!lead) {
        return this.failure("Invalid Lead!");
      }

      await new QueryBuilder("lead_activities").insert({
        lead_id: leadId,
        company_id: this.companyId,
        activity_type: activityType,
        note,
        created_by: userId,
      });

      return this.success("Activity Logged!");
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Dashboard counts by status ────────────────────────────────────────────
  async getLeadStats() {
    try {
      const sql = `
        SELECT status, COUNT(*) AS count
        FROM leads
        WHERE company_id = ?
        GROUP BY status
      `;
      const rows = (await executeQuery(sql, [this.companyId])) as any[];

      const stats = {
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
      };
      for (const row of rows) {
        stats[row.status as keyof typeof stats] = row.count;
      }

      return this.success(stats);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Delete (hard delete — leads have no soft-delete status column) ───────
  async deleteLead(leadId: string) {
    try {
      const res = await new QueryBuilder("leads")
        .where("lead_id = ?", leadId)
        .where("company_id = ?", this.companyId)
        .delete();

      if (res <= 0) {
        return this.failure("Delete Failed!");
      }

      return this.success("Lead Deleted!"); // lead_activities cascade-deletes via FK
    } catch (error) {
      return this.handleError(error);
    }
  }
}

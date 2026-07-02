import { encrypt } from "../../helpers/crypto-helper";
import { QueryBuilder } from "../../helpers/db-helper";
import { RepositoryBase } from "../../helpers/repository-base";
import mysql from "mysql2/promise"



export type FileLog = {
    id: string,
    name: string,
    status: number,
    utr_required: number,
    ledger: number,
}

export class FileRepository extends RepositoryBase {
    private companyId: string;

    constructor(companyId: string) {
        super()
        this.companyId = companyId;
    }

    async saveLog({
        associatedType,
        associatedId,
        filePath,
        dir,
        fileName,
        fileSize,
        fileMime,
        fileType = 'image',
        addedFrom = 'default',
        updatedBy,
        is_protected = 0,
        transactionConnection
    }: {
        associatedType: string,
        associatedId: string,
        filePath: string,
        dir: string,
        fileName: string,
        fileSize: number,
        fileMime: string,
        updatedBy: string,
        fileType?: string,
        addedFrom?: string,
        is_protected?: number,
        transactionConnection?: mysql.Connection
    }) {
        try {
            var identifier = encrypt(filePath);
            const result = await new QueryBuilder('file_log')
                .setConnection(transactionConnection)
                .insert({
                    associated_type: associatedType,
                    associated_id: associatedId,
                    added_from: addedFrom,
                    dir: dir,
                    path: filePath,
                    file_name: fileName,
                    file_size: fileSize,
                    file_mime: fileMime,
                    file_type: fileType,
                    identifier: identifier,
                    updated_by: updatedBy,
                    is_protected: is_protected,
                    company_id: this.companyId,
                    status: 1,
                })

            if (result > 0) {
                return this.success(result);
            }
            return this.failure('Failed to save file log');
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getFileRecord(
        identifier: string,
        transactionConnection?: mysql.Connection
    ) {
        try {
            const result = await new QueryBuilder('file_log')
                .setConnection(transactionConnection)
                .orWhere('identifier = ?', identifier)
                .orWhere('id = ?', identifier)
                .where('status > 0')
                .select(['path', 'file_mime', 'file_name', 'dir', 'identifier']) as any[]

            if (result.length == 0) {
                return this.failure('File Not Found!')
            }

            return this.success(result[0])
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getFileFromType(
        associatedId: string,
        associatedType: string,
        transactionConnection?: mysql.Connection,
        multiple: boolean = false
    ) {
        try {
            const result = await new QueryBuilder('file_log')
                .setConnection(transactionConnection)
                .where('associated_id = ?', associatedId)
                .where('associated_type = ?', associatedType)
                .where('status > 0')
                .select(['path', 'file_mime', 'file_name', 'dir', 'identifier']) as any[]

            if (result.length == 0) {
                return this.failure('File Not Found!')
            }

            return this.success(multiple ? result : result[0])
        } catch (error) {
            return this.handleError(error);
        }
    }

    async markFileInactive(
        identifier: string,
        userId: string,
        transactionConnection?: mysql.Connection
    ) {
        try {
            const result = await new QueryBuilder('file_log')
                .setConnection(transactionConnection)
                .orWhere('identifier = ?', identifier)
                .orWhere('id = ?', identifier)
                .where('status > 0')
                .update({
                    status: 0,
                    updated_by: userId
                })

            if (result == 0) {
                return this.failure('File Not Found!')
            }

            return this.success('File Deleted!')
        } catch (error) {
            return this.handleError(error);
        }
    }
} 
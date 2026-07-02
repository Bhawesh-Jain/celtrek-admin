'use client'

import { Column, DataTable } from "@/components/data-table/data-table";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { deleteProduct, getProductList, updateProductStatus } from "@/lib/actions/product";
import formatDate from "@/lib/utils/date";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Product } from "@/lib/repositories/productRepository";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Edit2, Trash2 } from "lucide-react";
import { encryptIdForUrl } from "@/lib/utils/crypto";
import ZoomableImage from "@/components/ZoomableImage";


export default function ProductListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [reload, setReload] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { showError, showDeleteConfirmation, setDialogLoading, showSuccess } = useGlobalDialog();
  const pathname = usePathname();

  useEffect(() => {
    if (!reload) return;
    (async () => {
      setIsLoading(true);
      setItems([]);
      try {
        const result = await getProductList({});
        setItems(result.result || []);
      } catch (error: any) {
        showError("Request Failed!", error?.message || error.toString());
      } finally {
        setIsLoading(false);
        setReload(false);
      }
    })();
  }, [reload]);

  const itemsRef = useRef<any[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const onStatusChange = useCallback(
    async (field: string, id: number, checked: boolean) => {
      const currentItems = itemsRef.current;
      const currentItem = currentItems.find(item => item.product_id === id);

      if (!currentItem) return;
      const previousValue = currentItem[field];

      setItems(prevItems => {
        return prevItems.map(item =>
          item.product_id === id
            ? { ...item, [field]: checked ? 1 : 0 }
            : item
        );
      });

      try {
        const result = await updateProductStatus({ field, status: checked ? '1' : '0', productId: id.toString() });
        if (!result.success) {
          setItems(prevItems => {
            return prevItems.map(item =>
              item.product_id === id
                ? { ...item, [field]: previousValue }
                : item
            );
          });
          showError("Request Failed!", result.message);
        }
      } catch (error: any) {
        setItems(prevItems => {
          return prevItems.map(item =>
            item.product_id === id
              ? { ...item, [field]: previousValue }
              : item
          );
        });
        showError("Request Failed!", error?.message || error.toString());
      }
    },
    [showError]
  );

  const deleteProductFunc = async (product: Product) => {
    showDeleteConfirmation(
      `Delete ${product.product_name}?`,
      'Are you sure you want to delete this product? This action is irreversible and will destroy all the products in this product!',
      async () => {
        try {
          setDialogLoading(true);

          const result = await deleteProduct(String(product.product_id));

          if (result.success) {
            showSuccess('Request Successful', result.result);
            setReload(true);
          } else {
            showError('Error', result.message);
          }
        } catch (error: any) {
          showError('Error', 'Something went wrong!');
        } finally {
          setDialogLoading(false);
        }
      }
    );
  }
  const columns: Column<Product>[] = [
    {
      id: "product_image",
      header: "Product Image",
      accessorKey: "product_image",
      sortable: true,
      visible: true,
      cell: (row) => {
        return (
          <ZoomableImage src={row.product_image} alt={row.product_name} key={row.product_id} />
        )
      },
    },
    {
      id: "product_name",
      header: "Product Name",
      accessorKey: "product_name",
      sortable: true,
      visible: true,
    },
    {
      id: "total_variants",
      header: "Variants in Product",
      accessorKey: "total_variants",
      sortable: true,
      visible: true,
    },
    {
      id: "creator_name",
      header: "Product Added By",
      accessorKey: "creator_name",
      sortable: true,
      visible: true,
    },
    {
      id: "created_on",
      header: "Created On",
      accessorKey: "created_on",
      sortable: true,
      visible: true,
      cell: (row) => {
        if (row.created_on) {
          return formatDate(row.created_on.toString(), 'dd-MM-yyyy');
        } else {
          return "N/A";
        }
      },
    },
    {
      id: "status",
      header: "Active",
      accessorKey: "status",
      cell: (row) => (
        <Switch
          checked={row.status == 1}
          onCheckedChange={(checked) => onStatusChange('status', row.product_id, checked)}
        />
      ),
      sortable: true,
      visible: true,
    },
    {
      id: "product_id",
      header: "Actions",
      accessorKey: "product_id",
      sortable: true,
      visible: true,
      align: 'right',
      cell: (row) => {
        return (
          <div>
            <Link href={`${pathname}/edit/${encryptIdForUrl(String(row.product_id))}?h=Edit Product`}>
              <ButtonTooltip title="Edit Product" variant={'ghost'} size={'icon'}>
                <Edit2 />
              </ButtonTooltip>
            </Link>
            <ButtonTooltip title="Delete Product" variant={'ghost'} className="text-destructive" size={'icon'} onClick={() => deleteProductFunc(row)}>
              <Trash2 />
            </ButtonTooltip>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {
        <Container>
          <CardHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col space-y-1.5">
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage your products</CardDescription>
              </div>

              <Link href={`${pathname}/add?h=Add Product`}>
                <Button>
                  Add New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              fillEmpty={true}
              loading={isLoading}
              setReload={setReload}
            />
          </CardContent>
        </Container>
      }
    </>
  );
}
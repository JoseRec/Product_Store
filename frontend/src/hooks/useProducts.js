import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllProducts, createProduct, getProductById, deleteProduct, getMyProducts } from "../lib/api";

export const useProducts = () => {
  const result = useQuery({ queryKey: ["products"], queryFn: getAllProducts });
  return result;
};

export const useCreateProduct = () => {
  return useMutation({ mutationFn: createProduct });
}

export const useProduct = (id) => {
  return useQuery({ queryKey: ["products", id], queryFn: () => getProductById(id), enabled: !!id });
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient  ();

  return useMutation({
    mutationFn: deleteProduct, onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    }
  })
}

export const useMyProducts = () => {
  return useQuery({ queryKey: ["my-products"], queryFn: getMyProducts });
}

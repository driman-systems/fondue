export type ProductType = 'FONDUE' | 'BEBIDA' | 'OUTRO'

export type ProdutoDTO = {
  id: string
  name: string
  description: string | null
  type: ProductType
  price: number
  usaChocolate: boolean
  usaAcompanhamentos: boolean
  quantidadeAcompanhamentos: number | null
  variations: { id: string; name: string; price: number }[]
  toppings: { id: string; name: string; precoExtra: number }[]
}

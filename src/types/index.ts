export interface Product {
  productid: number
  name: string
  description?: string
  price: number
  material?: string
  keyword?: string
  category?: string
  imageurl?: string
}

export interface User {
  userid: number
  username: string
  email: string
  role: 'admin' | 'user' | 'guest'
  avatar: string
}

export interface CartItem {
  id: number
  productid: number
  name: string
  description: string
  price: number
  imageurl: string
  quantity: number
}
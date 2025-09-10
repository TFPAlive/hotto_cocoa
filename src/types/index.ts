export interface Product {
  id: number
  name: string
  description?: string
  price: number
  material?: string
  keyword?: string
  category?: string
  imageUrl?: string
}

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user' | 'guest'
  avatar?: string
}
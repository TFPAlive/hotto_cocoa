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
  cartitemid: number
  drinkid: number
  quantity: number
  price: number
  name: string
  imageurl: string | null
}

export interface Drink {
	drinkid: number
	name: string
	description?: string
	imageurl?: string
	baseprice: number
	uniqueid: string
	products: { productid: number; name: string; quantity: number }[]
}
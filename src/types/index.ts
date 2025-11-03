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
	avatar?: string
	phone?: string
	firstname?: string
	lastname?: string
	birthdate?: string
	gender?: string
	created_at?: string
	last_login?: string
}

export interface CartItem {
  cartitemid: number
  drinkid?: number
  productid?: number
  quantity: number
  price: number
  name: string
  imageurl: string | null
  item_type: 'drink' | 'product'
}

export interface Drink {
	drinkid: number
	description?: string
	imageurl?: string
	baseprice: number
	uniqueid: string
	productids: number[]
	name: string
}

export interface Address {
	addressid: number;
	userid?: number;
	firstname: string;
	lastname: string;
	postalcode: string;
	prefecture: string;
	city: string;
	town: string;
	building?: string;
	phone: string;
	isdefault: boolean;
}

// MyPage Component Interfaces
export interface OrderItem {
  orderitemid: number
  drinkid: number
  name: string
  quantity: number
  price: number
  imageurl?: string
}

export interface Order {
  orderid: number
  userid: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  created_at: string
  updated_at: string
  shipping_address: string
  items: OrderItem[]
  shipping_name: string
  shipping_phone: string
}

export interface Review {
  reviewid: number
  userid: number
  drinkid: number
  productid?: number
  rating: number
  title: string
  comment: string
  created_at: string
  updated_at: string
  status: 'pending' | 'approved' | 'rejected'
  drink_name?: string
  product_name?: string
  drink_image?: string
  product_image?: string
}

export interface FavoriteItem {
  favoriteid: number
  userid: number
  type: 'product' | 'drink'
  itemid: number
  created_at: string
  // Joined data
  name: string
  price: number
  imageurl?: string
  description?: string
}

export interface HistoryItem {
  historyid: number
  userid: number
  type: 'product' | 'drink'
  itemid: number
  visited_at: string
  visit_count: number
  // Joined data
  name: string
  price: number
  imageurl?: string
}

export interface PaymentMethod {
  paymentid: number
  userid: number
  type: 'credit_card' | 'paypal' | 'bank_transfer'
  provider: string
  last_four?: string
  expiry_month?: number
  expiry_year?: number
  cardholder_name?: string
  is_default: boolean
  created_at: string
}

export interface SecuritySetting {
  key: string
  label: string
  description: string
  enabled: boolean
}

export interface LoginSession {
  sessionid: number
  device: string
  location: string
  ip_address: string
  user_agent: string
  last_activity: string
  is_current: boolean
}

export interface PermissionSetting {
  key: string
  category: string
  label: string
  description: string
  enabled: boolean
  required?: boolean
}

export interface DataExport {
  type: string
  label: string
  description: string
  size: string
  lastExported?: string
}

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
}

export interface Region {
  code: string
  name: string
  timezone: string
}

export interface LocalizationSettings {
  language: string
  currency: string
  region: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  numberFormat: 'comma' | 'space' | 'period'
  firstDayOfWeek: 0 | 1 // 0 = Sunday, 1 = Monday
}
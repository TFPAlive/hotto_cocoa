<script setup lang="ts">
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import { useMyCart } from '@/composables/useMyCart'
import { useAddresses } from '@/composables/useAddresses'
import { useRouter } from 'vue-router'
import { auth } from '@/composables/useAuth'
import { formatPrice } from '@/utils/currency'

const { cartItems, totalPrice, fetchCartItems } = useMyCart()
const { addresses, fetchAddresses, loading: addrLoading } = useAddresses()
const router = useRouter()

const selectedAddressId = ref<number | null>(null)
const showAddressDropdown = ref(false)
const shippingActionsRef = ref<HTMLElement | null>(null)
let docClickHandler: ((e: MouseEvent) => void) | null = null

const defaultAddress = computed(() => addresses.value.find(a => a.isdefault) ?? null)
const shippingAddress = computed(() => {
    if (selectedAddressId.value) {
        return addresses.value.find(a => a.addressid === selectedAddressId.value) ?? defaultAddress.value
    }
    return defaultAddress.value
})
const placing = ref(false)
const selectedPayment = ref<'paypay' | 'card' | 'convenience'>('paypay')

onMounted(async () => {
    await fetchCartItems()
    await fetchAddresses()
    if (addresses.value.length > 0) selectedAddressId.value = addresses.value.find(a => a.isdefault)?.addressid ?? addresses.value[0].addressid
    // close dropdown when clicking outside
    docClickHandler = (e: MouseEvent) => {
        if (!shippingActionsRef.value) return
        if (!showAddressDropdown.value) return
        const el = shippingActionsRef.value as HTMLElement
        if (!el.contains(e.target as Node)) {
            showAddressDropdown.value = false
        }
    }
    document.addEventListener('click', docClickHandler)
})

onBeforeUnmount(() => {
    if (docClickHandler) {
        document.removeEventListener('click', docClickHandler)
        docClickHandler = null
    }
})

async function placeOrder() {
    if (!selectedAddressId.value) {
        alert('Please select a shipping address')
        return
    }

    if (cartItems.value.length === 0) {
        alert('Your cart is empty')
        return
    }

    placing.value = true

    try {
        const payload = {
            userid: auth.user?.userid,
            addressid: selectedAddressId.value,
            paymentMethod: selectedPayment.value,
            items: cartItems.value.map(i => ({ 
                cartitemid: i.cartitemid, 
                drinkid: i.drinkid, 
                productid: i.productid,
                quantity: i.quantity,
                item_type: i.item_type 
            }))
        }

        const res = await fetch('/api/user/placeOrder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error || 'Failed to place order')
        }

        const body = await res.json().catch(() => ({}))

        // Handle different payment method responses (mock)
        if (selectedPayment.value === 'paypay') {
            // Example: redirect to PayPay payment URL
            if (body.paymentUrl) {
                window.location.href = body.paymentUrl
                return
            }
        } else if (selectedPayment.value === 'card') {
            // Card payment: show mock success / token
            alert('Card payment initiated (mock). Token: ' + (body.token || 'n/a'))
        } else if (selectedPayment.value === 'convenience') {
            // Convenience store: show instructions
            alert('Please follow convenience store payment instructions:\n' + (body.instructions || 'n/a'))
        }

        // Default: go to home after mock
        router.push('/')
    } catch (err: any) {
        console.error('placeOrder error', err)
        alert(err.message || 'Failed to place order')
    } finally {
        placing.value = false
    }
}

function selectAddress(addressid: number) {
    selectedAddressId.value = addressid
    showAddressDropdown.value = false
}

async function setAsDefault(addressid: number) {
  const userid = auth.user?.userid
  if (!userid) {
    alert('未ログインまたは無効なユーザー')
    return
  }

  // Optimistic update: mark local addresses immediately
  const prevStates = addresses.value.map(a => ({ addressid: a.addressid, isdefault: a.isdefault }))
  addresses.value.forEach(a => { a.isdefault = a.addressid === addressid })

  selectedAddressId.value = addressid

  try {
        const res = await fetch('/api/user/address?action=setDefault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid, addressid })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || 'デフォルト設定に失敗しました')
    }
  } catch (err: any) {
    console.error('Set default address error:', err)
    // revert optimistic update
    prevStates.forEach(s => {
      const found = addresses.value.find(a => a.addressid === s.addressid)
      if (found) found.isdefault = s.isdefault
    })
    alert(err.message || 'デフォルト設定中にエラーが発生しました')
  } finally {
    selectedAddressId.value = null
  }
}
</script>

<template>
    <div class="checkout-root">
        <div class="checkout-main">
            <section class="shipping">
                <div class="shipping-header-row">
                    <h2>Shipping address</h2>
                    <div class="shipping-actions" ref="shippingActionsRef">
                        <button class="change-address-btn" @click="showAddressDropdown = !showAddressDropdown">Change address</button>
                        <button v-if="showAddressDropdown" class="add-address-inline" @click="router.push({ path: '/mypage', query: { from: 'checkout', section: 'addresses' } })">Add address</button>
                        <!-- dropdown panel anchored to actions -->
                        <transition name="fade-slide">
                            <div v-if="showAddressDropdown" class="address-dropdown-anchored">
                                <div v-if="addresses.length === 0" class="no-addresses">No addresses found. Please add one in your account.</div>
                                <ul v-else class="address-list-dropdown">
                                    <li v-for="addr in addresses" :key="addr.addressid" :class="{ selected: addr.addressid === selectedAddressId }" @click="selectAddress(addr.addressid), setAsDefault(addr.addressid)">
                                        <div class="addr-name">{{ addr.firstname }} {{ addr.lastname }}</div>
                                        <div class="addr-line">{{ addr.prefecture }} {{ addr.city }} {{ addr.town }} {{ addr.building }}</div>
                                        <div class="addr-phone">{{ addr.phone }}</div>
                                    </li>
                                </ul>
                            </div>
                        </transition>
                    </div>
                </div>
                <div v-if="addrLoading">Loading addresses...</div>
                <div v-else>
                    <div v-if="!defaultAddress">No default address found. Click Change address to select or add one.</div>
                    <div v-else class="default-address">
                        <div class="addr-name">{{ shippingAddress?.firstname }} {{ shippingAddress?.lastname }}</div>
                        <div class="addr-line">〒{{ shippingAddress?.postalcode }} {{ shippingAddress?.prefecture }} {{ shippingAddress?.city }} {{ shippingAddress?.town }} {{ shippingAddress?.building }}</div>
                        <div class="addr-phone">TEL: {{ shippingAddress?.phone }}</div>
                    </div>
                </div>
            </section>

            <section class="items">
                <h2>Items</h2>
                <div v-if="cartItems.length === 0">Your cart is empty.</div>
                <div v-else class="items-list">
                    <div v-for="item in cartItems" :key="item.cartitemid" class="checkout-item">
                        <div class="item-type-badge" :class="item.item_type">
                            {{ item.item_type === 'drink' ? '🍹 Custom Drink' : '🛒 Product' }}
                        </div>
                        <div class="item-content">
                            <img v-if="item.imageurl" :src="item.imageurl" alt="" class="item-image" />
                            <div class="item-info">
                                <div class="item-name">{{ item.name }}</div>
                                <div class="item-description" v-if="item.item_type === 'drink'">
                                    Custom drink recipe
                                </div>
                                <div class="item-description" v-else>
                                    Individual product
                                </div>
                                <div class="item-qty">Qty: {{ item.quantity }}</div>
                                <div class="item-price">{{ formatPrice(item.price * item.quantity) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="payment-method">
                <h2>Payment Method</h2>
                <div v-if="cartItems.length === 0">Add items to your cart to proceed with payment.</div>
                <div v-else>
                    <p>Please select a payment method from the options on the right and click "Place order" to complete your purchase.</p>
                    <div class="pm-option">
                        <label>
                            <input type="radio" name="payment" value="paypay" v-model="selectedPayment" />
                            <strong>PayPay</strong>
                            <div class="pm-desc">Fast mobile payment via PayPay</div>
                        </label>
                    </div>
                    <div class="pm-option">
                        <label>
                            <input type="radio" name="payment" value="card" v-model="selectedPayment" />
                            <strong>Credit / Debit Card</strong>
                            <div class="pm-desc">Pay with your credit or debit card (mock)</div>
                        </label>
                    </div>
                    <div class="pm-option">
                        <label>
                            <input type="radio" name="payment" value="convenience" v-model="selectedPayment" />
                            <strong>Convenience store</strong>
                            <div class="pm-desc">Pay at a participating convenience store using a payment code</div>
                        </label>
                    </div>
                </div>
            </section>
        </div>

        <aside class="checkout-side">
            <div class="summary">
                <h3>Order summary</h3>
                <div class="line"><span>Items total</span><span>{{ formatPrice(totalPrice) }}</span></div>
                <div class="line"><span>Shipping</span><span>FREE</span></div>
                <hr />
                <div class="line total"><span>Total</span><span>{{ formatPrice(totalPrice) }}</span></div>

                <button class="place-btn" :disabled="placing || cartItems.length === 0" @click="placeOrder">{{ placing ? 'Placing...' : 'Place order' }}</button>
            </div>
        </aside>
    </div>
</template>

<style scoped>
.checkout-root {
    display: flex;
    gap: 24px;
    padding: 24px;
}

.checkout-main {
    flex: 1;
    width: 80%;
}

.checkout-side {
    width: 20%;
}

.address-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
}

.shipping-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.change-address-btn {
    background: transparent;
    border: 1px solid var(--hover-color);
    color: var(--font-color);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
}

.change-address-btn:hover {
    background: var(--sub-bg-color);
}

.shipping-actions { display: flex; gap: 8px; align-items: center }
.add-address-inline { background: #4caf50; color: var(--main-bg-color); border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer }
.add-address-inline:hover { filter: brightness(0.95) }

.default-address { border: 1px solid var(--shadow-color); padding: 12px; border-radius: 8px; margin-bottom: 8px }

.address-dropdown { margin-top: 8px; border: 1px solid var(--shadow-color); padding: 12px; border-radius: 8px; background: var(--main-bg-color); box-shadow: 0 6px 20px rgba(0,0,0,0.06) }
.address-list-dropdown { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px }
.address-list-dropdown li { padding: 10px; border-radius: 6px; border: 1px solid var(--sub-bg-color); cursor: pointer }

.address-dropdown-anchored {
    position: absolute;
    right: 0;
    top: 36px;
    width: 500px;
    max-width: calc(100vw - 40px);
    background: var(--main-bg-color);
    border: 1px solid var(--shadow-color);
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    z-index: 1200;
}

.shipping-actions { position: relative }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 240ms ease }
.fade-slide-enter-from { opacity: 0; transform: translateY(-8px) }
.fade-slide-enter-to { opacity: 1; transform: translateY(0) }
.fade-slide-leave-from { opacity: 1 }
.fade-slide-leave-to { opacity: 0; transform: translateY(-6px) }

.address-list li {
    border: 1px solid var(--shadow-color);
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
}

.address-list li.selected {
    border-color: var(--hover-color);
    background: var(--sub-bg-color);
}

.items-list {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
}

.items-list::-webkit-scrollbar {
    height: 8px;
}

.items-list::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 8px;
}

.checkout-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 0 0 auto;
    width: 280px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #eee;
}

.item-type-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    width: fit-content;
}

.item-type-badge.drink {
    background: #e3f2fd;
    color: #1976d2;
}

.item-type-badge.product {
    background: #fff3e0;
    color: #f57c00;
}

.item-content {
    display: flex;
    gap: 12px;
    align-items: center;
}

.item-description {
    font-size: 0.85rem;
    color: #666;
    margin: 2px 0;
}

.item-image {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 8px;
}

.item-info {
    flex: 1;
}

.summary {
    border: 1px solid #eee;
    padding: 16px;
    border-radius: 8px;
}
.summary .line {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
}
.summary .total {
    font-weight: bold;
}
.place-btn {
    width: 100%;
    padding: 12px;
    background: #c9b37c;
    border: none;
    color: #fff;
    border-radius: 8px;
    cursor: pointer;
}

.payment-methods { margin: 12px 0 16px }
.payment-methods h4 { margin: 0 0 8px }
.pm-option { margin-bottom: 8px }
.pm-option label { display: flex; gap: 8px; align-items: flex-start }
.pm-option input[type="radio"] { margin-top: 6px }
.pm-desc { color: #666; font-size: 0.9rem }

</style>
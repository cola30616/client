import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Cart, CartItem } from '../../shared/models/cart';
import { Product } from '../../shared/models/product';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  baseUrl = environment.apiUrl;
  private http = inject(HttpClient)
  cart = signal<Cart | null>(null);
  itemCount = computed(() => {
    // 計算數量
    return this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0)
  });
  totals = computed(() =>{
    const cart = this.cart();
    if(!cart) return null;
    // 計算總金額( 單價 X 數量)
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0 )
    // 運費
    const shipping = 0
    // 折扣
    const discount = 0
    return {
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping -discount
    }
  })


  getCart(id: string){
    return this.http.get<Cart>(this.baseUrl + 'cart?id=' + id).pipe(
      map(cart =>{
        this.cart.set(cart);
        return cart;
      })
    )
  }

  setCart(cart: Cart){
    return this.http.post<Cart>(this.baseUrl + 'cart', cart).subscribe({
      next: cart =>this.cart.set(cart)
    })
  }

  addItemToCart(item: CartItem | Product, quantity = 1){
    const cart = this.cart() ?? this.createCart()
    if(this.isProduct(item)){
      item = this.mapProductToCartItem(item);
    }

    cart.items = this.addOrUpdateItem(cart.items, item, quantity)
    this.setCart(cart);

  }
  // quantity = 1 預設一次刪除一個， 傳入整個quantity 就是全部刪掉了~
  removeItemFromCart(productId: number,quantity = 1){
    const cart = this.cart();
    if(!cart) return;
    const index  = cart.items.findIndex(x=>x.productId === productId)
    if(index !== -1){
      // 
      if(cart.items[index].quantity > quantity){
        cart.items[index].quantity -= quantity
      }else{
        // 依次移除一個
        cart.items.splice(index, 1);
      }

      if(cart.items.length === 0){
        this.deleteCart();
      }else{
        this.setCart(cart)
      }
    }
  }

  deleteCart() {
    this.http.delete(this.baseUrl + 'cart?id=' + this.cart()?.id).subscribe({
      next: () =>{
        localStorage.removeItem('cart_id');
        this.cart.set(null)
      }
    })
  }

  private addOrUpdateItem(items: CartItem[], item: CartItem, quantity: number): CartItem[]{
    const index = items?.findIndex(x => x.productId === item.productId);
    if(index === -1){
      item.quantity = quantity;
      items.push(item);
    }else{
      items[index].quantity += quantity
    }
    return items
  }

  private mapProductToCartItem(item: Product): CartItem {
    return{
      productId: item.id,
      productName: item.name,
      price: item.price,
      quantity: 0,
      pictureUrl: item.pictureUrl,
      brand: item.brand,
      type: item.type
    }
  }

  //判斷產品是否為該商品
  private isProduct(item: CartItem | Product): item is Product{
    return (item as  Product).id !== undefined
  }

  private createCart(): Cart{
   const cart = new Cart();
    localStorage.setItem('cart_id',cart.id);
    return cart
  }
}

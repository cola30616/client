import { inject, Injectable } from '@angular/core';
import { CartService } from './cart.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InitService {
  // 先在app config 設定，因為初始化要從local storage 讀取購物車，並加上一個讀取畫面~
  private cartService = inject(CartService);

  init(){
    const cartId = localStorage.getItem('cart_id');
    const cart$ = cartId ? this.cartService.getCart(cartId) : of(null)

    return cart$
  }
}

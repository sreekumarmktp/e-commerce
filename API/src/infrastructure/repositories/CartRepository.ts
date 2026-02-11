import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../../domain/entities/Cart';
import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun, withTransaction, Queryable } from '../database/postgresHelpers';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PoolClient } from 'pg';

export class CartRepository implements ICartRepository {
  private db = Database.getInstance().getConnection();

  async getCart(): Promise<Cart> {
    const cartRow = await dbGet<any>(this.db, 'SELECT * FROM cart WHERE id = $1', ['default-cart']);
    if (!cartRow) {
      // Should not happen; `Database` seeds default-cart
      const now = new Date().toISOString();
      await dbRun(this.db, 'INSERT INTO cart (id, totalAmount, itemCount, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5)', [
        'default-cart',
        0,
        0,
        now,
        now
      ]);
    }

    const itemRows = await dbAll<any>(this.db, 'SELECT * FROM cart_items WHERE cartId = $1', ['default-cart']);
    const items: CartItem[] = itemRows.map((row) => ({
      id: row.id,
      productId: row.productid,
      productName: row.productname,
      productImage: row.productimage,
      price: Number(row.price), // Postgres numeric returns string, cast to number
      quantity: row.quantity,
      totalPrice: Number(row.totalprice)
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const finalCartRow = cartRow ?? (await dbGet<any>(this.db, 'SELECT * FROM cart WHERE id = $1', ['default-cart']));
    return {
      id: finalCartRow.id,
      items,
      totalAmount,
      itemCount,
      createdAt: new Date(finalCartRow.createdat),
      updatedAt: new Date(finalCartRow.updatedat)
    };
  }

  async addToCart(request: AddToCartRequest): Promise<CartItem> {
    return withTransaction(this.db, async (client: PoolClient) => {
      const product = await dbGet<any>(client, 'SELECT * FROM products WHERE id = $1', [request.productId]);
      if (!product) throw new NotFoundError('Product not found');

      // Convert price/stock to number just in case
      product.price = Number(product.price);
      product.stock = Number(product.stock);

      const existingItem = await dbGet<any>(
        client,
        'SELECT * FROM cart_items WHERE cartId = $1 AND productId = $2',
        ['default-cart', request.productId]
      );

      if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity);
        existingItem.price = Number(existingItem.price);

        const newQuantity = existingItem.quantity + request.quantity;
        if (newQuantity > product.stock) {
          throw new ValidationError('Requested quantity exceeds available stock', {
            stock: product.stock,
            requestedQuantity: newQuantity
          });
        }
        const newTotalPrice = product.price * newQuantity;
        await dbRun(client, 'UPDATE cart_items SET quantity = $1, totalPrice = $2 WHERE id = $3', [
          newQuantity,
          newTotalPrice,
          existingItem.id
        ]);
        await this.updateCartTotals(client);
        return {
          id: existingItem.id,
          productId: existingItem.productid,
          productName: existingItem.productname,
          productImage: existingItem.productimage,
          price: existingItem.price,
          quantity: newQuantity,
          totalPrice: newTotalPrice
        };
      }

      const itemId = uuidv4();
      if (request.quantity > product.stock) {
        throw new ValidationError('Requested quantity exceeds available stock', {
          stock: product.stock,
          requestedQuantity: request.quantity
        });
      }
      const totalPrice = product.price * request.quantity;
      await dbRun(
        client,
        'INSERT INTO cart_items (id, cartId, productId, productName, productImage, price, quantity, totalPrice) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [itemId, 'default-cart', product.id, product.name, product.image, product.price, request.quantity, totalPrice]
      );
      await this.updateCartTotals(client);
      return {
        id: itemId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: request.quantity,
        totalPrice
      };
    });
  }

  async updateCartItem(itemId: string, request: UpdateCartItemRequest): Promise<CartItem | null> {
    return withTransaction(this.db, async (client: PoolClient) => {
      const item = await dbGet<any>(client, 'SELECT * FROM cart_items WHERE id = $1', [itemId]);
      if (!item) return null;

      item.price = Number(item.price);
      item.quantity = Number(item.quantity);

      const product = await dbGet<any>(client, 'SELECT * FROM products WHERE id = $1', [item.productid]);
      if (!product) throw new NotFoundError('Product not found');

      product.stock = Number(product.stock);

      if (request.quantity > product.stock) {
        throw new ValidationError('Requested quantity exceeds available stock', {
          stock: product.stock,
          requestedQuantity: request.quantity
        });
      }

      const newTotalPrice = item.price * request.quantity;
      await dbRun(client, 'UPDATE cart_items SET quantity = $1, totalPrice = $2 WHERE id = $3', [
        request.quantity,
        newTotalPrice,
        itemId
      ]);

      await this.updateCartTotals(client);
      return {
        id: item.id,
        productId: item.productid,
        productName: item.productname,
        productImage: item.productimage,
        price: item.price,
        quantity: request.quantity,
        totalPrice: newTotalPrice
      };
    });
  }

  async removeFromCart(itemId: string): Promise<boolean> {
    return withTransaction(this.db, async (client: PoolClient) => {
      const result = await dbRun(client, 'DELETE FROM cart_items WHERE id = $1', [itemId]);
      await this.updateCartTotals(client);
      return result.changes > 0;
    });
  }

  async clearCart(): Promise<boolean> {
    return withTransaction(this.db, async (client: PoolClient) => {
      await dbRun(client, 'DELETE FROM cart_items WHERE cartId = $1', ['default-cart']);
      await this.updateCartTotals(client);
      return true;
    });
  }

  private async updateCartTotals(db: Queryable): Promise<void> {
    const rows = await dbAll<any>(
      db,
      'SELECT SUM(totalprice) as totalamount, SUM(quantity) as itemcount FROM cart_items WHERE cartid = $1',
      ['default-cart']
    );
    const totalAmount = Number(rows[0]?.totalamount || 0);
    const itemCount = Number(rows[0]?.itemcount || 0);
    const now = new Date().toISOString();

    await dbRun(db, 'UPDATE cart SET totalAmount = $1, itemCount = $2, updatedAt = $3 WHERE id = $4', [
      totalAmount,
      itemCount,
      now,
      'default-cart'
    ]);
  }
}

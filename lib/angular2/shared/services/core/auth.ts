/* tslint:disable */
declare var Object: any;
import {Injectable, Inject} from '@angular/core';
import {InternalStorage} from '../../storage/storage.swaps';
import {SDKToken} from '../../models/BaseModels';
/**
 * @author Jonathan Casarrubias <twitter:@johncasarrubias> <github:@mean-expert-official>
 * @module SocketConnection
 * @license MIT
 * @description
 * This module handle socket connections and return singleton instances for each
 * connection, it will use the SDK Socket Driver Available currently supporting
 * Angular 2 for web, NativeScript 2 and Angular Universal.
 **/
@Injectable()
export class LoopBackAuth {
  /**
   * @type {SDKToken}
   **/
  private token: SDKToken = new SDKToken();
  /**
   * @type {string}
   **/
  protected prefix: string = '$LoopBackSDK$';

  private loadedToken: Promise<any>;

  /**
   * @method constructor
   * @param {InternalStorage} storage Internal Storage Driver
   * @description
   * The constructor will initialize the token loading data from storage
   **/
  constructor(@Inject(InternalStorage) protected storage: InternalStorage) {
    this.loadedToken = new Promise((resolve, reject) => {
      Promise.all([
        this.load('id'),
        this.load('user'),
        this.load('userId'),
        this.load('issuedAt'),
        this.load('created'),
        this.load('ttl'),
        this.load('rememberMe')
      ]).then(data => {
        this.token.id = data[0];
        this.token.user = data[1];
        this.token.userId = data[2];
        this.token.issuedAt = data[3];
        this.token.created = data[4];
        this.token.ttl = data[5];
        this.token.rememberMe = data[6];
        resolve(this.token);
      });
    });
  }

  public ready():Promise<any>{
    return this.loadedToken;
  }

  /**
   * @method setRememberMe
   * @param {boolean} value Flag to remember credentials
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials
   **/
  public setRememberMe(value: boolean): Promise<any> {
    return this.persist("rememberMe", value);
  }

  /**
   * @method setUser
   * @param {any} user Any type of user model
   * @return {void}
   * @description
   * This method will update the user information and persist it if the
   * rememberMe flag is set.
   **/
  public setUser(user: any): Promise<any> {
    this.token.user = user;
    return this.save();
  }

  /**
   * @method setToken
   * @param {SDKToken} token SDKToken or casted AccessToken instance
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials
   **/
  public setToken(token: SDKToken): Promise<any> {
    this.token = Object.assign(this.token, token);
    return this.save();
  }

  /**
   * @method getToken
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials.
   **/
  public getToken(): Promise<SDKToken> {
    return this.ready().then(() => {
      return Promise.resolve(this.token);
    });
  }

  /**
   * @method getAccessTokenId
   * @return {string}
   * @description
   * This method will return the actual token string, not the object instance.
   **/
  public getAccessTokenId(): Promise<any> {
    return this.load('id');
  }

  /**
   * @method getCurrentUserId
   * @return {any}
   * @description
   * This method will return the current user id, it can be number or string.
   **/
  public getCurrentUserId(): Promise<any> {
    return this.load("userId");
  }

  /**
   * @method getCurrentUserData
   * @return {any}
   * @description
   * This method will return the current user instance.
   **/
  public getCurrentUserData(): Promise<any> {
    return this.load("user").then(user => {
      let parsedUser = (typeof user === 'string') ? JSON.parse(user) : user;
      return Promise.resolve(parsedUser);
    })
  }

  public getRememberMe(): Promise<any> {
    return this.load("rememberMe");
  }

  /**
   * @method save
   * @return {boolean} Wether or not the information was saved
   * @description
   * This method will save in either local storage or cookies the current credentials.
   * But only if rememberMe is enabled.
   **/
  public save(): Promise<any> {
    return this.getRememberMe().then(rememberMe => {

      if (rememberMe) {
        return Promise.all([
          this.persist('id', this.token.id),
          this.persist('user', this.token.user),
          this.persist('userId', this.token.userId),
          this.persist('issuedAt', this.token.issuedAt),
          this.persist('created', this.token.created),
          this.persist('ttl', this.token.ttl),
          this.persist('rememberMe', this.token.rememberMe),
        ]);
      } else {
        return Promise.resolve(false);
      }

    });

  };

  /**
   * @method load
   * @param {string} prop Property name
   * @return {any} Any information persisted in storage
   * @description
   * This method will load either from local storage or cookies the provided property.
   **/
  protected load(prop: string): Promise<any> {
    return this.storage.get(`${this.prefix}${prop}`);
  }

  /**
   * @method clear
   * @return {void}
   * @description
   * This method will clear cookies or the local storage.
   **/
  public clear(): void {
    return Promise.all(Object.keys(this.token).map(prop => {
      return this.storage.remove(`${this.prefix}${prop}`)
    })).then(val => {
      this.token = new SDKToken();
      return Promise.resolve(val);
    });
  }

  /**
   * @method clear
   * @return {void}
   * @description
   * This method will clear cookies or the local storage.
   **/
  protected persist(prop: string, value: any): Promise<any> {
    try {
      return this.storage.set(
        `${this.prefix}${prop}`,
        (typeof value === 'object') ? JSON.stringify(value) : value
      );
    }
    catch (err) {
      console.error('Cannot access local/session storage:', err);
    }
  }
}

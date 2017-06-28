/* tslint:disable */
import {subscribeOn} from "rxjs/operator/subscribeOn";
declare var Object: any;

import {Observable, Subject} from "rxjs"
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

  private loadedToken: Subject<any>;

  /**
   * @method constructor
   * @param {InternalStorage} storage Internal Storage Driver
   * @description
   * The constructor will initialize the token loading data from storage
   **/
  constructor(@Inject(InternalStorage) protected storage: InternalStorage) {
    this.loadedToken = new Subject();
    Observable.forkJoin(
      this.load('id'),
      this.load('user'),
      this.load('userId'),
      this.load('created'),
      this.load('ttl'),
      this.load('rememberMe')
    ).subscribe(data => {
      this.token.id = data[0];
      this.token.user = data[1];
      this.token.userId = data[2];
      this.token.created = data[3];
      this.token.ttl = data[4];
      this.token.rememberMe = data[5];
      this.loadedToken.next(this.token);
    });
  }

  public ready(): Observable<any> {
    return this.loadedToken;
  }

  /**
   * @method setRememberMe
   * @param {boolean} value Flag to remember credentials
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials
   **/
  public setRememberMe(value: boolean): Observable<any> {
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
  public setUser(user: any): Observable<any> {
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
  public setToken(token: SDKToken): Observable<any> {
    this.token = Object.assign(this.token, token);
    return this.save();
  }

  /**
   * @method getToken
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials.
   **/
  public getToken(): Observable<SDKToken> {
    let subject = new Subject();
    this.ready().subscribe(() => {
      subject.next(this.token);
    });
    return subject;
  }

  /**
   * @method getAccessTokenId
   * @return {string}
   * @description
   * This method will return the actual token string, not the object instance.
   **/
  public getAccessTokenId(): Observable<any> {
    return this.load('id');
  }

  /**
   * @method getCurrentUserId
   * @return {any}
   * @description
   * This method will return the current user id, it can be number or string.
   **/
  public getCurrentUserId(): Observable<any> {
    return this.load("userId");
  }

  /**
   * @method getCurrentUserData
   * @return {any}
   * @description
   * This method will return the current user instance.
   **/
  public getCurrentUserData(): Observable<any> {
    let subject = new Subject();
    this.load("user").subscribe(user => {
      let parsedUser = (typeof user === 'string') ? JSON.parse(user) : user;
      subject.next(parsedUser);
    });
    return subject;
  }

  public getRememberMe(): Observable<any> {
    return this.load("rememberMe");
  }

  /**
   * @method save
   * @return {boolean} Wether or not the information was saved
   * @description
   * This method will save in either local storage or cookies the current credentials.
   * But only if rememberMe is enabled.
   **/
  public save(): Observable<any> {

    return Observable.forkJoin(
      this.persist('id', this.token.id),
      this.persist('user', this.token.user),
      this.persist('userId', this.token.userId),
      this.persist('issuedAt', this.token.issuedAt),
      this.persist('created', this.token.created),
      this.persist('ttl', this.token.ttl),
      this.persist('rememberMe', this.token.rememberMe),
    )
  };

  /**
   * @method load
   * @param {string} prop Property name
   * @return {any} Any information persisted in storage
   * @description
   * This method will load either from local storage or cookies the provided property.
   **/
  protected load(prop: string): Observable<any> {
    return Observable.fromPromise(this.storage.get(`${this.prefix}${prop}`));
  }

  /**
   * @method clear
   * @return {void}
   * @description
   * This method will clear cookies or the local storage.
   **/
  public clear(): Observable<any> {
    let subject = new Subject();
    Observable.forkJoin(Object.keys(this.token).map(prop => {
      return this.storage.remove(`${this.prefix}${prop}`)
    })).subscribe(val => {
      this.token = new SDKToken();
      return subject.next(val);
    });
    return subject;
  }

  /**
   * @method clear
   * @return {void}
   * @description
   * This method will clear cookies or the local storage.
   **/
  protected persist(prop: string, value: any): Observable<any> {
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

import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HttpDataService {
    constructor(private _http: HttpClient) { }

    get(url: string, paramObj?: any): Observable<any> {
        if (paramObj != undefined && paramObj != null) {
            //let params = new HttpParams();
            //Object.keys(paramObj).forEach(function (key) {
            //    params = params.append(key, paramObj[key]);
            //});
            //return this._http.get(url, params);

            //Since Angular 5.0.0-beta.6
            return this._http.get(url, { params: paramObj });
        }
        else {
            return this._http.get(url);
        }
    }

    getWithoutCache(url: string, paramObj?: any): Observable<any> {
        let headers = new HttpHeaders()
            .set('Cache-Control', 'no-cache')
            .set('Pragma', 'no-cache')
            .set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');

        if (paramObj != undefined && paramObj != null) {
            //let params = new HttpParams();
            //Object.keys(paramObj).forEach(function (key) {
            //    params = params.append(key, paramObj[key]);
            //});
            //return this._http.get(url, params);

            //Since Angular 5.0.0-beta.6
            return this._http.get(url, { params: paramObj, headers: headers });
        }
        else {
            return this._http.get(url, { headers: headers });
        }
    }

    getByteArray(url: string, paramObj?: any): Observable<any> {
        if (paramObj != undefined && paramObj != null) {
            return this._http.get(url, {
                params: paramObj,
                responseType: 'arraybuffer',
                observe: 'response'
            });
        }
        else {
            return this._http.get(url, {
                responseType: 'arraybuffer',
                observe: 'response'
            });
        }
    }

    post(url: string, model: any): Observable<any> {
        let body: any;
        if (typeof model === 'string' || model instanceof String) {
            body = model;
        }
        else {
            body = JSON.stringify(model);
        }
        //let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this._http.post(url, body, { headers: headers });
    }

    put(url: string, id: number, model: any): Observable<any> {
        let body = JSON.stringify(model);
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this._http.put(url + id, body, { headers: headers });
    }

    delete(url: string, id: number): Observable<any> {
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        return this._http.put(url + id, { headers: headers });
    }

    parseErrorMessage(err: HttpErrorResponse): string {
        if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            //console.log('An error occurred:', err.error.message);  
            return err.error.message;
        }
        else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            //console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
            return err.error;
        }
    }
}
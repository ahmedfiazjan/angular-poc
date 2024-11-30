import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LocationData {
  ip: string;
  city: string;
  country_name: string;
}

export interface ApiObject {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly JSON_API_URL = 'https://ipapi.co/json';
  private readonly OBJECTS_API_URL = 'https://api.restful-api.dev/objects';

  constructor(private http: HttpClient) {}

  getIpData(): Observable<any> {
    return this.http.get(this.JSON_API_URL);
  }

  getObjects(): Observable<any> {
    return this.http.get(this.OBJECTS_API_URL);
  }
}

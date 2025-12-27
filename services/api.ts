
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      timeout: 15000,
    });
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, data, config);
    return response.data;
  }
}

export const api = new ApiService();

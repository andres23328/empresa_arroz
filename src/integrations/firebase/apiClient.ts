// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://empresa-arroz.onrender.com/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    console.log('Response:', response);
    console.log('Request URL:', url);
    console.log('Request options:', { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, fullName: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Employee endpoints
  async getEmployees() {
    return this.request('/employees');
  }

  async getEmployee(id: string) {
    return this.request(`/employees/${id}`);
  }

  async createEmployee(employeeData: any) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id: string, employeeData: any) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id: string) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }



  // Contract endpoints
  // Contract endpoints
  async getContracts() {
    return this.request('/contratos'); // 👈 antes: '/contracts'
  }
  
  async getContract(id: string) {
    return this.request(`/contratos/${id}`); // 👈 antes: '/contracts'
  }
  
  async getContractsByEmployee(employeeId: string) {
    return this.request(`/contratos/empleados/${employeeId}`); // 👈 antes: '/contracts/employee'
  }
  
  async createContract(contractData: any) {
    return this.request('/contratos', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }
  
  async updateContract(id: string, contractData: any) {
    return this.request(`/contratos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contractData),
    });
  }
  
  async deleteContract(id: string) {
    return this.request(`/contratos/${id}`, {
      method: 'DELETE',
    });
  }

  // Recuperación de contraseña
  async requestPasswordReset(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }


  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  

}

export const apiClient = new ApiClient(API_BASE_URL);



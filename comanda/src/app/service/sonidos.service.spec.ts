import { TestBed } from '@angular/core/testing';

import { SonidosService } from './sonidos.service';

describe('SonidosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SonidosService = TestBed.get(SonidosService);
    expect(service).toBeTruthy();
  });
});

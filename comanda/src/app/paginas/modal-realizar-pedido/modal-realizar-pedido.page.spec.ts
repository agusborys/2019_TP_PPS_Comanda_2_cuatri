import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRealizarPedidoPage } from './modal-realizar-pedido.page';

describe('ModalRealizarPedidoPage', () => {
  let component: ModalRealizarPedidoPage;
  let fixture: ComponentFixture<ModalRealizarPedidoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalRealizarPedidoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalRealizarPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

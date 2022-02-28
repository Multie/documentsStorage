import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAcceptComponent } from './delete-accept.component';

describe('DeleteAcceptComponent', () => {
  let component: DeleteAcceptComponent;
  let fixture: ComponentFixture<DeleteAcceptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteAcceptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAcceptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

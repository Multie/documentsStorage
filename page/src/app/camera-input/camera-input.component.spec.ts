import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraInputComponent } from './camera-input.component';

describe('CameraInputComponent', () => {
  let component: CameraInputComponent;
  let fixture: ComponentFixture<CameraInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CameraInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

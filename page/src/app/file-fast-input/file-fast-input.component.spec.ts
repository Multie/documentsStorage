import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileFastInputComponent } from './file-fast-input.component';

describe('FileFastInputComponent', () => {
  let component: FileFastInputComponent;
  let fixture: ComponentFixture<FileFastInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileFastInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileFastInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

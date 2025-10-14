import { ComponentFixture, TestBed } from '@angular/core/testing';

import { donorComponent } from './donor.component';

describe('donorComponent', () => {
  let component: donorComponent;
  let fixture: ComponentFixture<donorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [donorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(donorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

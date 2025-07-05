import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPatientComponent } from './all-patient.component';

describe('AllPatientComponent', () => {
  let component: AllPatientComponent;
  let fixture: ComponentFixture<AllPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPatientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

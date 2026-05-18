import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransfusionListComponent } from './transfusion-list.component';

describe('TransfusionListComponent', () => {
  let component: TransfusionListComponent;
  let fixture: ComponentFixture<TransfusionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransfusionListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransfusionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

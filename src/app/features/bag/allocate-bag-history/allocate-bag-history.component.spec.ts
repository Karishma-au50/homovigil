import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateBagHistoryComponent } from './allocate-bag-history.component';

describe('AllocateBagHistoryComponent', () => {
  let component: AllocateBagHistoryComponent;
  let fixture: ComponentFixture<AllocateBagHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocateBagHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllocateBagHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

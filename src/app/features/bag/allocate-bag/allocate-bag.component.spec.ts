import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateBagComponent } from './allocate-bag.component';

describe('AllocateBagComponent', () => {
  let component: AllocateBagComponent;
  let fixture: ComponentFixture<AllocateBagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocateBagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllocateBagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

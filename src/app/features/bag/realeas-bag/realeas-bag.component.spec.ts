import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleasBagComponent } from './realeas-bag.component';

describe('ReleasBagComponent', () => {
  let component: ReleasBagComponent;
  let fixture: ComponentFixture<ReleasBagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleasBagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleasBagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

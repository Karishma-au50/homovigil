import { TestBed } from '@angular/core/testing';
import { HemoVigilHttpService } from './hemovigil.http.service';


describe('HemoVigilHttpService', () => {
  let service: HemoVigilHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HemoVigilHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { Component, OnInit, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-bar-code',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './bar-code.component.html',
  styleUrl: './bar-code.component.scss'
})
export class BarCodeComponent implements OnInit {
  @Input() patientData: any;
  @Output() closeDialog = new EventEmitter<void>();

  @ViewChildren('barcodeCanvas') canvasRefs!: QueryList<ElementRef>;

  patientUHID: string | null = null;
  // isAnyBag: boolean = false;
  // barcodeItems: { bcStr: string, displayBagId: string }[] = [];

  // qrDataString: string[] = [];
  // qrItems: { qrStr: string, displayBagId: string }[] = [];

  // constructor(private authService: AuthService) { }

  ngOnInit() {
    if (!this.patientData?._id) return;
    const patientUhid = this.patientData?.UHID;

    if(patientUhid){
      this.patientUHID = String(patientUhid);
    }

    // console.log(this.patientData?._id);

    // this.authService.getPatientDetailsWithBags(this.patientData._id).subscribe({
    //   next: (res) => {
    //     let allocationBags = res?.data?.allocations || [];
    //     this.isAnyBag = allocationBags.length > 0;

    //     if (this.isAnyBag) {
    //       allocationBags.forEach((bag: any) => {

    //         let bagLabel = bag.bloodBagId?.bloodBagId || bag.bloodBagId?._id || bag._id;

    //         let barcodeValue = bag.allocationShortId || bag._id;

    //         this.barcodeItems.push({
    //           bcStr: barcodeValue,
    //           displayBagId: bagLabel
    //         });

    //       });

    //       setTimeout(() => this.renderBarcodes(), 0);
    //     }

    //   },
    //   error: (err) => {
    //     console.error("Error fetching patient bags:", err);
    //   }
    // });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.patientUHID) {
        this.renderBarcodes();
      }
    }, 0);
  }

  renderBarcodes() {
    if(!this.patientUHID || !this.canvasRefs){
      return;
    }

    this.canvasRefs.forEach((canvasRef, index) => {
      JsBarcode(canvasRef.nativeElement, this.patientUHID as string, {
        format: "CODE128",
        lineColor: "#000",
        width: 1.5,       // 👈 CHANGE THIS: Reduces the thickness of the bars (try 1.2 or 1.5)
        height: 40,       // 👈 CHANGE THIS: Reduces the vertical height
        displayValue: false, // Keeps the text hidden (as we discussed)
        margin: 5
      });
    });
  }

  close() {
    this.closeDialog.emit();
  }

  printQrCodes() {
    let printContents = '';

    // Convert each canvas into a Base64 image URL for printing
    this.canvasRefs.forEach((canvasRef, index) => {
      let dataUrl = canvasRef.nativeElement.toDataURL('image/png');
      let bagLabel = this.patientUHID;

      printContents += `
        <div class="qr-card">
          <img src="${dataUrl}" />
          <p class="bag-label">${bagLabel}</p>
        </div>
      `;
    });

    if (!printContents) return;

    let printWindow = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
    // console.log(this.patientData);
    printWindow?.document.open();
    printWindow?.document.write(`
      <html>
        <head>
          <title>Print Barcodes - ${this.patientData.firstname}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .print-header { text-align: center; margin-bottom: 30px; padding-bottom: 10px; }
            .print-grid { display: flex; flex-wrap: wrap; justify-content: start; gap: 20px; }
            .print-grid > div { text-align: center; display: flex; flex-direction: column; align-items: center; }
            .qr-card { text-align: center; background: white; }
            
            /* Target the new image tags */
            .qr-card img { display: block; margin: 0 auto; max-width: 250px; height: auto; }
            .bag-label { margin-top: 10px; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="print-header">
            <h2 style="margin-bottom:0px;">Patient: ${this.patientData.firstname} ${this.patientData.lastname}</h2>
            <p>UHID: ${this.patientData.UHID} | HaemovigilID: ${this.patientData.haemovigilId}</p>
          </div>
          <div class="print-grid">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    printWindow?.document.close();
  }

}

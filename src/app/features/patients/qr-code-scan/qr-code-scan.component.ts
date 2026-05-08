import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-code-scan',
  standalone: true,
  imports: [CommonModule, ButtonModule, QRCodeComponent],
  templateUrl: './qr-code-scan.component.html',
  styleUrl: './qr-code-scan.component.scss'
})
export class QrCodeScanComponent implements OnInit {
  @Input() patientData: any;
  @Output() closeDialog = new EventEmitter<void>();

  isAnyBag:boolean = false;
  
  qrDataString: string[] = [];

  constructor(private authService:AuthService){}

  ngOnInit() {
    if (!this.patientData?._id) return;

    // console.log(this.patientData?._id);

    this.authService.getPatientDetailsWithBags(this.patientData._id).subscribe({
      next: (res) => {
        let allocationBags = res?.data?.allocations || [];
        this.isAnyBag = allocationBags.length> 0;
        
        if(this.isAnyBag){
          allocationBags.forEach((bag: any) => {
            
            let essentialIds = {
              bagId: bag._id,
              patientId: this.patientData._id,
              bloodBagId: bag.bloodBagId?._id
            };

            let bagQrStr = JSON.stringify(essentialIds);
            this.qrDataString.push(bagQrStr);

          });
        }
        
      },
      error: (err) => {
        console.error("Error fetching patient bags:", err);
      }
    });
  }

  close(){
    this.closeDialog.emit();
  }

  printQrCodes() {
    // Get the HTML content of the QR code grid
    let printContents = document.getElementById('print-section')?.innerHTML;
    if(!printContents) return;

    // Open a temporary window
    let printWindow = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
    
    // Write a clean HTML page just for printing
    printWindow?.document.open();
    printWindow?.document.write(`
      <html>
        <head>
          <title>Print QR Codes - ${this.patientData.firstname}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .print-header { text-align: center; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid #ccc; }
            .print-grid { display: flex; flex-wrap: wrap; gap: 15px; }
            .qr-card { text-align: center; padding: 10px; border: 1px dashed #999; border-radius: 8px; }
            .qr-card img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            .bag-label { margin-top: 10px; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="print-header">
            <h2 style="margin-bottom:0px;">Patient: ${this.patientData.firstname} ${this.patientData.lastname}</h2>
            <p>UHID: ${this.patientData.UHID}</p>
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

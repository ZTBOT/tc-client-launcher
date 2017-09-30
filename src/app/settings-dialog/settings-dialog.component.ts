import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ElectronService } from 'ngx-electron';

import { ConfigurationService } from '../configuration.service';

@Component({
    selector: 'tc-settings-dialog',
    templateUrl: './settings-dialog.component.html',
    styleUrls: ['./settings-dialog.component.css'],
    animations: [
        trigger('scaleIn', [
            state('false', style({ visibility: 'hidden', transform: 'translate(-50%, -50%) scale(0.95)' })),
            state('true', style({ visibility: 'visible', transform: 'translate(-50%, -50%) scale(1)' })),
            transition('false => true', animate('100ms ease-out')),
            transition('true => false', animate('100ms ease-in')),
        ])
    ]
})
export class SettingsDialogComponent implements OnChanges {

    @Input()
    display: boolean;

    @Output()
    displayChange = new EventEmitter<boolean>();

    @ViewChild('settingsForm')
    settingsForm: NgForm;

    displayMask = false;

    constructor(
        private configurationService: ConfigurationService,
        private electron: ElectronService,
        private zone: NgZone) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ('display' in changes) {
            if (changes['display'].currentValue) {
                this.settingsForm.setValue({
                    loginServerUrl: this.configurationService.LoginServerUrl,
                    gameInstallDir: this.configurationService.WowInstallDir,
                    use64bit: this.configurationService.Use64Bit
                });
                this.displayMask = true;
            } else {
                setTimeout(() => {
                    this.displayMask = false;
                }, 100);
            }
        }
    }

    saveConfiguration(): void {
        this.configurationService.LoginServerUrl = this.settingsForm.value.loginServerUrl;
        // disabled controls don't write to .value
        this.configurationService.WowInstallDir = this.settingsForm.controls['gameInstallDir'].value;
        this.configurationService.Use64Bit = this.settingsForm.value.use64bit;
        this.close();
    }

    close(): void {
        this.displayChange.emit(false);
    }

    openDirectoryPicker(): void {
        this.electron.ipcRenderer.once('directory-selected', (event: Electron.Event, dir: string[]) => {
            if (dir != undefined) {
                this.zone.runGuarded(() => this.settingsForm.controls['gameInstallDir'].setValue(dir[0]));
            }
        });
        this.electron.ipcRenderer.send('open-directory-selection');
    }
}

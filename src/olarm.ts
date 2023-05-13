import { Logger } from 'homebridge';
import fetch from 'node-fetch';

interface OlarmArea {
  areaName: string;
  deviceId: string;
  areaNumber: number;
  areaState: OlarmAreaState;
}

enum OlarmAreaState {
  Armed = 'arm',
  Disarmed = 'disarm',
  ArmedStay = 'stay',
  NotReady = 'notready',
}

enum OlarmAreaAction {
  Arm = 'area-arm',
  Stay = 'area-stay',
  Disarm = 'area-disarm',
}

export class Olarm {
  private readonly apiKey: string;
  public readonly log: Logger;

  constructor(apiKey: string, log: Logger) {
    this.apiKey = apiKey;
    this.log = log;
  }

  /**
   * Fetches all devices on the Olarm account and aggregates their areas into a single list.
   * @returns Promise<OlarmArea[]>
   */
  getAreas = async (): Promise<OlarmArea[]> => {
    const response = await fetch('https://apiv4.olarm.co/api/v4/devices', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    const data = await response.json() as any;
    const rawDevices = data.data;

    let olarmAreas: OlarmArea[] = [];
    // Loop through all devices on the account and strip out their areas
    rawDevices.forEach((d: any) => {
      // For each area in each device, add them
      d.deviceProfile.areasLabels.forEach((l: string, i: number) => {
        olarmAreas.push({
          areaName: l,
          areaState: d.deviceState.areas[i],
          areaNumber: i + 1,
          deviceId: d.deviceId
        });
      });
    });

    return olarmAreas;
  }

  setArea = async (deviceId: string, areaNumber: number, action: OlarmAreaAction) => {

  }
}

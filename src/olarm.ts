import { Logger } from 'homebridge';
import fetch from 'node-fetch';

const API_BASE_URL = 'https://api.olarm.com/api/v4';

export interface OlarmArea {
  areaName: string;
  deviceId: string;
  areaNumber: number;
  areaState: OlarmAreaState;
}

/**
 * Area states from Olarm API v4 deviceState.areas
 * @see https://api.olarm.com/api/v4
 */
export enum OlarmAreaState {
  Armed = 'arm',
  Disarmed = 'disarm',
  ArmedStay = 'stay',
  ArmedSleep = 'sleep',
  NotReady = 'notready',
  Alarm = 'alarm',
  Fire = 'fire',
  Emergency = 'emergency',
  Countdown = 'countdown',
}

const VALID_AREA_STATES = new Set<string>(Object.values(OlarmAreaState));

function normalizeAreaState(s: string): OlarmAreaState {
  return VALID_AREA_STATES.has(s) ? s as OlarmAreaState : OlarmAreaState.Disarmed;
}

export enum OlarmAreaAction {
  Arm = 'area-arm',
  Stay = 'area-stay',
  Disarm = 'area-disarm',
  Sleep = 'area-sleep',
}

interface DevicesResponse {
  page: number;
  pageLength: number;
  pageCount: number;
  data?: Array<{
    deviceId: string;
    deviceName: string;
    deviceState: { areas?: string[] };
    deviceProfile: { areasLabels?: string[] };
  }>;
}

interface ActionResponse {
  actionId?: string;
  actionStatus?: string;
  actionMsg?: string;
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
   * Uses API v4: GET /devices with pagination support.
   * @returns Promise<OlarmArea[]>
   */
  getAreas = async (): Promise<OlarmArea[]> => {
    const allDevices: DevicesResponse['data'] = [];
    let page = 1;
    let pageCount = 1;

    do {
      const response = await fetch(`${API_BASE_URL}/devices?page=${page}&pageLength=50`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.log.error(`Olarm API error (${response.status}): ${errorBody}`);
        throw new Error(`Olarm API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as DevicesResponse;
      const rawDevices = data.data ?? [];

      if (page === 1 && rawDevices.length === 0) {
        this.log.warn('No devices found on Olarm account');
        return [];
      }

      allDevices.push(...rawDevices);
      pageCount = data.pageCount ?? 1;
      page++;
    } while (page <= pageCount);

    const olarmAreas: OlarmArea[] = [];
    for (const d of allDevices) {
      const areasLabels = d.deviceProfile?.areasLabels ?? [];
      const areas = d.deviceState?.areas ?? [];

      for (let i = 0; i < areasLabels.length; i++) {
        const areaState = normalizeAreaState(areas[i] ?? 'disarm');
        olarmAreas.push({
          areaName: areasLabels[i] || `Area ${i + 1}`,
          areaState,
          areaNumber: i + 1,
          deviceId: d.deviceId,
        });
      }
    }

    return olarmAreas;
  };

  /**
   * Sends an action to a device area (arm, stay, disarm, etc.)
   * Uses API v4: POST /devices/{deviceId}/actions
   */
  setArea = async (area: OlarmArea, action: OlarmAreaAction): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/devices/${area.deviceId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionCmd: action,
        actionNum: area.areaNumber,
      }),
    });

    const result = await response.json() as ActionResponse | { errors?: unknown[] };

    if (!response.ok) {
      const errorMsg = 'errors' in result ? JSON.stringify(result.errors) : (result as ActionResponse).actionMsg ?? response.statusText;
      this.log.error(`Olarm setArea failed (${response.status}): ${errorMsg}`);
      throw new Error(`Failed to set area: ${errorMsg}`);
    }

    const actionResult = result as ActionResponse;
    if (actionResult.actionStatus && actionResult.actionStatus !== 'OK') {
      this.log.warn(`Olarm action ${action} returned: ${actionResult.actionStatus} - ${actionResult.actionMsg ?? ''}`);
    }
  };
}

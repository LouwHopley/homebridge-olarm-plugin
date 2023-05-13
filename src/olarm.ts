

interface OlarmDevice {
  deviceId: string;
  deviceName: string;
  deviceStatus: string;
}

interface OlarmArea {
  areaName: string;
  areaNumber: number;
  areaState: OlarmAreaState;
}

enum OlarmAreaState {
  Armed = 'arm',
  Disarmed = 'disarm',
  ArmedStay = 'stay'
}

enum OlarmAreaAction {
  Arm = 'area-arm',
  Stay = 'area-stay',
  Disarm = 'area-disarm',
}

export class Olarm {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getDevices = async (): Promise<OlarmDevice[]> => {
    return []; // todo
  }

  setArea = async (deviceId: string, areaNumber: number, action: OlarmAreaAction) => {

  }
}

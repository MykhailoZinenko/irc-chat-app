export interface DeviceInfo {
  name: string
  type: 'web' | 'desktop' | 'mobile'
}

export class DeviceDetector {
  static detect(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase()

    const browserInfo = this.getBrowserInfo(ua)
    const osInfo = this.getOSInfo(ua)
    const deviceType = this.getDeviceType(ua)

    const name = `${browserInfo} on ${osInfo}`

    return {
      name,
      type: deviceType
    }
  }

  private static getBrowserInfo(ua: string): string {
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    if (ua.includes('opera')) return 'Opera'
    if (ua.includes('electron')) return 'Electron'
    return 'Unknown Browser'
  }

  private static getOSInfo(ua: string): string {
    if (ua.includes('windows')) return 'Windows'
    if (ua.includes('mac os x') || ua.includes('macos')) return 'macOS'
    if (ua.includes('linux')) return 'Linux'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
    return 'Unknown OS'
  }

  private static getDeviceType(ua: string): 'web' | 'desktop' | 'mobile' {
    if (ua.includes('electron')) return 'desktop'
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
      return 'mobile'
    }
    return 'web'
  }
}

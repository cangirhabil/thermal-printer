import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as net from "net";

const execAsync = promisify(exec);

interface DetectionResult {
  method: "usb" | "serial" | "network" | "windows";
  details: any;
  priority: number;
  available: boolean;
  testResult?: string;
}

// USB/Serial portları kontrol et ve önceliklendir
async function detectSerialPorts(): Promise<DetectionResult[]> {
  try {
    const { SerialPort } = await import("serialport");
    const ports = await SerialPort.list();

    const results: DetectionResult[] = [];

    for (const port of ports) {
      const portPath = port.path.toLowerCase();
      
      // COM1'i atla (genellikle mouse/klavye gibi cihazlar)
      if (portPath === 'com1') {
        console.log(`⏭️ ${port.path} atlanıyor (genellikle mouse/klavye)`);
        continue;
      }

      // COM3'ü en yüksek öncelik ver (yazıcı genelde burada)
      if (portPath === 'com3') {
        console.log(`🎯 ${port.path} bulundu - Yazıcı için öncelikli port`);
        results.push({
          method: "serial",
          details: {
            path: port.path,
            manufacturer: port.manufacturer,
            serialNumber: port.serialNumber,
            vendorId: port.vendorId,
            productId: port.productId,
          },
          priority: 1, // COM3 en yüksek öncelik
          available: true,
        });
        continue;
      }

      // USB cihazlarını tespit et
      const isUSB =
        port.vendorId ||
        port.productId ||
        (port.manufacturer && port.manufacturer.toLowerCase().includes("usb"));

      // Diğer COM/Serial portlar
      results.push({
        method: isUSB ? "usb" : "serial",
        details: {
          path: port.path,
          manufacturer: port.manufacturer,
          serialNumber: port.serialNumber,
          vendorId: port.vendorId,
          productId: port.productId,
        },
        priority: 2, // Diğer serial portlar ikinci öncelik
        available: true,
      });
    }

    return results;
  } catch (error) {
    console.error("Serial port detection error:", error);
    return [];
  }
}

// KP-302H yazıcısının model bilgisini ağ üzerinden kontrol et
async function getPrinterModel(ip: string, port: number): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000; // 2 saniye timeout
    let receivedData = "";

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      console.log(`📡 ${ip}:${port} bağlantısı kuruldu, model sorgulanıyor...`);
      // ESC/POS komutu ile yazıcı model bilgisi al
      // GS I 1 - Model bilgisi
      const modelCommand = Uint8Array.from([0x1D, 0x49, 0x01]); // GS I 1
      socket.write(modelCommand);
    });

    socket.on("data", (data) => {
      receivedData += data.toString("utf8");
      console.log(`📥 ${ip}:${port} yanıt: ${data.toString("utf8").trim()}`);
    });

    socket.on("timeout", () => {
      socket.destroy();
      console.log(`⏱️ ${ip}:${port} zaman aşımı`);
      resolve(null);
    });

    socket.on("error", (err) => {
      console.log(`❌ ${ip}:${port} hata: ${err.message}`);
      socket.destroy();
      resolve(null);
    });

    socket.on("close", () => {
      // Model bilgisini parse et
      const cleanData = receivedData.trim();
      if (cleanData.length > 0) {
        console.log(`✅ ${ip}:${port} model bilgisi alındı: ${cleanData}`);
        resolve(cleanData);
      } else {
        resolve(null);
      }
    });

    // Kısa bir süre sonra socket'i kapat
    setTimeout(() => {
      socket.end();
    }, 1500); // 1.5 saniye sonra kapat

    socket.connect(port, ip);
  });
}

// Network'te KP-302H yazıcısını ağ taraması ile bul (sadece model ismine bakılacak)
async function detectNetwork(): Promise<DetectionResult | null> {
  const TARGET_MODEL = "KP-302"; // Model isminin başlangıcı (KP-302H, KP-302, vb.)
  const printerPort = 9100;

  console.log(`\n🔍 Yazıcı ağda taranıyor (Port: ${printerPort})...`);

  // Ağdaki olası IP aralıklarını tarama
  // Tipik ev/ofis ağları için yaygın subnet'ler
  const subnets = [
    "192.168.1", // En yaygın
    "192.168.0",
    "192.168.2",
    "10.0.0",
  ];

  // Her subnet için 1-254 arası IP'leri tara
  // Performans için önce belirli IP'leri dene, sonra geniş tarama
  const priorityIPs = [
    "192.168.1.100", "192.168.1.200", "192.168.1.211",
    "192.168.2.100", "192.168.2.200", "192.168.2.211",
    "192.168.0.100", "192.168.0.200",
  ];

  // Önce öncelikli IP'leri hızlıca kontrol et
  console.log("🎯 Öncelikli IP adresleri kontrol ediliyor...");
  for (const ip of priorityIPs) {
    try {
      const isReachable = await testNetworkConnection(ip, printerPort);
      if (isReachable) {
        console.log(`✅ ${ip}:${printerPort} erişilebilir (Yazıcı port'u açık)`);
        const model = await getPrinterModel(ip, printerPort);
        
        // Model bilgisi kontrolü - boş veya KP-302 içeriyorsa kabul et
        // Bazı yazıcılar model sorgusuna boş yanıt verebilir
        const modelMatches = !model || model.trim() === "" || model.includes(TARGET_MODEL);
        
        if (modelMatches) {
          console.log(`🎉 Yazıcı bulundu! IP: ${ip}${model ? `, Model: ${model}` : " (Model bilgisi alınamadı ama port açık)"}`);
          return {
            method: "network",
            details: { 
              ip, 
              port: printerPort,
              model: model || "KP-302H (tespit edildi)",
            },
            priority: 3, // Network ÜÇÜNCÜ öncelik (COM ve Serial'dan sonra)
            available: true,
            testResult: `Yazıcı bulundu: ${ip}:${printerPort}`,
          };
        } else {
          console.log(`⚠️ ${ip} başka bir yazıcı (Beklenen: ${TARGET_MODEL}, Alınan: ${model})`);
        }
      }
    } catch (error) {
      continue;
    }
  }

  // Öncelikli IP'lerde bulunamadıysa, geniş ağ taraması yap
  console.log("🌐 Geniş ağ taraması başlatılıyor...");
  
  for (const subnet of subnets) {
    console.log(`📡 ${subnet}.0/24 ağı taranıyor...`);
    
    // Paralel tarama için IP'leri grupla (her seferde 50 IP - daha hızlı tarama)
    const batchSize = 50;
    for (let i = 1; i <= 254; i += batchSize) {
      const batch: Promise<{ ip: string; found: boolean; model?: string | null } | null>[] = [];
      
      for (let j = i; j < i + batchSize && j <= 254; j++) {
        const ip = `${subnet}.${j}`;
        
        // Öncelikli IP'leri tekrar kontrol etme
        if (priorityIPs.includes(ip)) continue;
        
        batch.push(
          (async () => {
            const isReachable = await testNetworkConnection(ip, printerPort);
            if (isReachable) {
              const model = await getPrinterModel(ip, printerPort);
              // Boş model veya KP-302 içeren model kabul edilir
              const matches = !model || model.trim() === "" || model.includes(TARGET_MODEL);
              return { ip, found: matches, model };
            }
            return null;
          })()
        );
      }
      
      const results = await Promise.all(batch);
      const found = results.find(r => r?.found);
      
      if (found) {
        console.log(`🎉 Yazıcı bulundu! IP: ${found.ip}${found.model ? `, Model: ${found.model}` : ""}`);
        return {
          method: "network",
          details: { 
            ip: found.ip, 
            port: printerPort,
            model: found.model || "KP-302H (tespit edildi)",
          },
          priority: 3, // Network ÜÇÜNCÜ öncelik (COM ve Serial'dan sonra)
          available: true,
          testResult: `Yazıcı bulundu: ${found.ip}:${printerPort}`,
        };
      }
    }
  }

  console.log(`❌ Yazıcı ağda bulunamadı`);
  return null;
}

// Network bağlantısını test et (timeout ile)
function testNetworkConnection(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1500; // 1.5 saniye timeout (daha hızlı tarama)

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

// Windows yazıcılarını kontrol et
async function detectWindowsPrinters(): Promise<DetectionResult[]> {
  try {
    // Windows yazıcı listesini al
    const { stdout } = await execAsync(
      'powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName | ConvertTo-Json"'
    );

    const printers = JSON.parse(stdout);
    const printerArray = Array.isArray(printers) ? printers : [printers];

    return printerArray
      .filter((p: any) => p.Name) // Geçerli yazıcılar
      .map((p: any) => ({
        method: "windows" as const,
        details: {
          name: p.Name,
          driver: p.DriverName,
          port: p.PortName,
        },
        priority: 4, // Windows yazıcı en düşük öncelik
        available: true,
      }));
  } catch (error) {
    console.error("Windows printer detection error:", error);
    return [];
  }
}

// Yazıcıyı test et (basit ESC/POS komutu gönder)
async function testPrinter(
  method: string,
  details: any
): Promise<{ success: boolean; message: string }> {
  try {
    // Serial/USB için test
    if (method === "usb" || method === "serial") {
      const { SerialPort } = await import("serialport");

      return await new Promise<{ success: boolean; message: string }>((resolve) => {
        const port = new SerialPort({
          path: details.path,
          baudRate: 9600,
          autoOpen: false,
        });

        let isResolved = false;
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            port.close();
            resolve({
              success: false,
              message: `${details.path} - Timeout (cihaz yanıt vermiyor - yazıcı olmayabilir)`,
            });
          }
        }, 3000); // 3 saniye timeout

        port.open((openErr) => {
          if (openErr) {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              resolve({
                success: false,
                message: `${details.path} - Port açılamadı: ${openErr.message}`,
              });
            }
            return;
          }

          // Port açıldı, ESC/POS printer status komutu gönder (DLE EOT n)
          // n=1: Printer status
          port.write(Buffer.from([0x10, 0x04, 0x01]), (writeErr) => {
            if (writeErr) {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                port.close();
                resolve({
                  success: false,
                  message: `${details.path} - Yazma hatası: ${writeErr.message}`,
                });
              }
              return;
            }

            // Yazma başarılı, yanıt bekle
            let hasValidResponse = false;
            let responseData: Buffer[] = [];
            
            const dataHandler = (data: Buffer) => {
              responseData.push(data);
              // ESC/POS yazıcılar genelde 1-4 byte status yanıtı verir
              if (data.length > 0 && data.length <= 4) {
                hasValidResponse = true;
                console.log(`   📥 ${details.path} yazıcı yanıtı aldı: ${data.toString('hex')}`);
              }
            };

            port.on("data", dataHandler);

            setTimeout(() => {
              port.removeListener("data", dataHandler);
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                port.close();
                
                if (hasValidResponse) {
                  resolve({
                    success: true,
                    message: `${details.path} - Yazıcı tespit edildi ✓`,
                  });
                } else if (responseData.length > 0) {
                  resolve({
                    success: false,
                    message: `${details.path} - Geçersiz yanıt (yazıcı değil, başka cihaz olabilir)`,
                  });
                } else {
                  resolve({
                    success: false,
                    message: `${details.path} - Yanıt yok (yazıcı bağlı değil)`,
                  });
                }
              }
            }, 1500); // 1.5 saniye yanıt bekleme
          });
        });

        port.on("error", (err) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            port.close();
            resolve({
              success: false,
              message: `${details.path} - Port hatası: ${err.message}`,
            });
          }
        });
      });
    }

    // Network için basit bağlantı testi
    if (method === "network") {
      const isConnected = await testNetworkConnection(details.ip, details.port);
      return {
        success: isConnected,
        message: isConnected
          ? `Network ${details.ip}:${details.port} - Bağlantı başarılı`
          : `Network ${details.ip}:${details.port} - Bağlantı başarısız`,
      };
    }

    // Windows yazıcı için
    if (method === "windows") {
      return {
        success: true,
        message: `Windows yazıcı "${details.name}" - Kullanılabilir`,
      };
    }

    return { success: false, message: "Bilinmeyen yöntem" };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Test hatası: ${error.message}` 
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quickCheck = searchParams.get("quick") === "true";
    const lastMethod = searchParams.get("lastMethod") || "";
    const lastIP = searchParams.get("lastIP") || "";
    
    if (quickCheck && lastMethod && lastIP) {
      // Hızlı kontrol modu - sadece son bilinen bağlantıyı test et
      console.log(`⚡ Hızlı kontrol: ${lastMethod} - ${lastIP}`);
      
      if (lastMethod === "network" && lastIP) {
        const isConnected = await testNetworkConnection(lastIP, 9100);
        if (isConnected) {
          console.log(`✅ ${lastIP} hala erişilebilir`);
          return NextResponse.json({
            success: true,
            method: "network",
            bestMethod: {
              connectionType: "network",
              details: { ip: lastIP, port: 9100 },
              testResult: "Bağlantı aktif",
            },
            allResults: [],
            message: `LAN bağlantısı aktif: ${lastIP}:9100`,
          });
        } else {
          console.log(`❌ ${lastIP} erişilemez, tam tarama gerekiyor`);
        }
      } else if (lastMethod === "serial" && lastIP) {
        // Serial port hızlı kontrolü
        try {
          const testResult = await testPrinter("serial", { path: lastIP });
          if (testResult.success) {
            console.log(`✅ ${lastIP} hala çalışıyor`);
            return NextResponse.json({
              success: true,
              method: "serial",
              bestMethod: {
                connectionType: "serial",
                details: { path: lastIP },
                testResult: testResult.message,
              },
              allResults: [],
              message: `Serial bağlantısı aktif: ${lastIP}`,
            });
          }
        } catch (err) {
          console.log(`❌ ${lastIP} erişilemez, tam tarama gerekiyor`);
        }
      }
    }
    
    console.log("🔍 Otomatik yazıcı algılama başlatılıyor...");
    console.log("📋 Model: KP-302H");
    console.log("📋 ÖNCELİK SIRASI: 1) COM Port (COM3)  2) Serial Port (Diğer)  3) Network (LAN)");
    console.log("⚠️  NOT: COM1 atlanacak (genellikle mouse/klavye)\n");

    const allResults: DetectionResult[] = [];

    // ÖNCELİK 1: COM/Serial portları kontrol et (EN YÜKSEK ÖNCELİK)
    console.log("🔌 Öncelik 1: COM/Serial portlar kontrol ediliyor...");
    
    try {
      const serialResults = await detectSerialPorts();
      
      if (serialResults.length === 0) {
        console.log("❌ Hiç COM/Serial port bulunamadı");
      } else {
        console.log(`📋 ${serialResults.length} adet COM/Serial port bulundu, test ediliyor...`);
        
        // Önce COM3'ü test et (priority 1)
        const com3Port = serialResults.find(r => r.details.path.toLowerCase() === 'com3');
        if (com3Port) {
          console.log(`🧪 Test ediliyor: ${com3Port.details.path} (Yazıcı için öncelikli)`);
          try {
            const testResult = await testPrinter(com3Port.method, com3Port.details);
            console.log(`   ${testResult.success ? '✅' : '❌'} ${testResult.message}`);
            
            const testedCom3 = {
              ...com3Port,
              testResult: testResult.message,
              available: testResult.success,
            };
            allResults.push(testedCom3);
            
            if (testResult.success) {
              console.log(`✅ YAZICI BULUNDU: ${com3Port.details.path}`);
              return NextResponse.json({
                success: true,
                method: "serial",
                bestMethod: {
                  connectionType: "serial",
                  details: com3Port.details,
                  testResult: testResult.message,
                },
                allResults: allResults,
                message: `COM3 bağlantısı aktif: ${com3Port.details.path}`,
              });
            }
          } catch (testError: any) {
            console.error(`   ❌ Test hatası: ${testError.message}`);
            allResults.push({
              ...com3Port,
              testResult: `Hata: ${testError.message}`,
              available: false,
            });
          }
        }
        
        // Diğer serial portları test et (priority 2)
        const otherPorts = serialResults.filter(r => r.details.path.toLowerCase() !== 'com3');
        for (const result of otherPorts) {
          console.log(`🧪 Test ediliyor: ${result.method} - ${result.details.path}`);
          try {
            const testResult = await testPrinter(result.method, result.details);
            console.log(`   ${testResult.success ? '✅' : '❌'} ${testResult.message}`);
            
            const testedResult = {
              ...result,
              testResult: testResult.message,
              available: testResult.success,
            };
            allResults.push(testedResult);
            
            if (testResult.success) {
              console.log(`✅ YAZICI BULUNDU: ${result.details.path}`);
              return NextResponse.json({
                success: true,
                method: result.method,
                bestMethod: {
                  connectionType: result.method,
                  details: result.details,
                  testResult: testResult.message,
                },
                allResults: allResults,
                message: `Serial bağlantısı aktif: ${result.method} - ${result.details.path}`,
              });
            }
          } catch (testError: any) {
            console.error(`   ❌ Test hatası: ${testError.message}`);
            allResults.push({
              ...result,
              testResult: `Hata: ${testError.message}`,
              available: false,
            });
          }
        }
        
        console.log("❌ COM/Serial portlar bulundu ama hiçbirinde yazıcı tespit edilemedi");
      }
    } catch (serialError: any) {
      console.error("⚠️ Serial port tarama hatası:", serialError.message);
      allResults.push({
        method: "serial",
        details: { error: serialError.message },
        priority: 1,
        available: false,
        testResult: `Hata: ${serialError.message}`,
      });
    }

    console.log("\n🌐 COM/Serial portta yazıcı bulunamadı, Network (LAN) kontrol ediliyor...");

    // ÖNCELİK 3: Network'te KP-302H'yi ağ taraması ile bul
    console.log("\n🌐 Öncelik 3: Network - Yazıcı ağda taranıyor...");
    
    try {
      const networkResult = await detectNetwork();

      if (networkResult && networkResult.available) {
        console.log(`✅ YAZICI BULUNDU (LAN): ${networkResult.details.ip}:${networkResult.details.port}`);
        allResults.push(networkResult);
        
        return NextResponse.json({
          success: true,
          method: "network",
          bestMethod: {
            connectionType: "network",
            details: networkResult.details,
            testResult: networkResult.testResult,
          },
          allResults: allResults,
          message: `LAN bağlantısı aktif: ${networkResult.details.ip}:${networkResult.details.port}`,
        });
      }
    } catch (networkError: any) {
      console.error("⚠️ Network tarama hatası:", networkError.message);
      allResults.push({
        method: "network",
        details: { error: networkError.message },
        priority: 3,
        available: false,
        testResult: `Hata: ${networkError.message}`,
      });
    }

    console.log(
      "❌ Network'te yazıcı bulunamadı, Windows yazıcılar kontrol ediliyor..."
    );

    // ÖNCELİK 4: Windows yazıcıları kontrol et (en son)
    console.log("\n🖨️ Öncelik 4: Windows yazıcılar kontrol ediliyor...");
    
    try {
      const windowsResults = await detectWindowsPrinters();

      const testedWindowsResults = await Promise.all(
        windowsResults.map(async (result) => {
          console.log(
            `🧪 Test ediliyor: ${result.method} - ${JSON.stringify(
              result.details
            )}`
          );
          try {
            const testResult = await testPrinter(result.method, result.details);
            return {
              ...result,
              testResult: testResult.message,
              available: testResult.success,
            };
          } catch (testError: any) {
            console.error(`❌ Test hatası (${result.method}):`, testError.message);
            return {
              ...result,
              testResult: `Hata: ${testError.message}`,
              available: false,
            };
          }
        })
      );

      allResults.push(...testedWindowsResults);

      const workingWindows = testedWindowsResults.find((r) => r.available);
      if (workingWindows) {
        console.log(`✅ Windows yazıcı bulundu: ${workingWindows.details.name}`);
        return NextResponse.json({
          success: true,
          method: "windows",
          bestMethod: {
            connectionType: "windows",
            details: workingWindows.details,
            testResult: workingWindows.testResult,
          },
          allResults: allResults,
          message: `Windows yazıcı bağlantı başarılı: ${workingWindows.details.name}`,
        });
      }
    } catch (windowsError: any) {
      console.error("⚠️ Windows yazıcı tarama hatası:", windowsError.message);
      allResults.push({
        method: "windows",
        details: { error: windowsError.message },
        priority: 4,
        available: false,
        testResult: `Hata: ${windowsError.message}`,
      });
    }

    console.log(
      `📋 ${allResults.length} toplam bağlantı denendi, hiçbiri çalışmadı`
    );

    // Hiçbir yazıcı bulunamadı
    return NextResponse.json({
      success: false,
      error: "Hiçbir çalışan yazıcı bağlantısı bulunamadı",
      allResults: allResults,
      message: "Yazıcı bulunamadı. Lütfen bağlantıları kontrol edin.",
      details: {
        networkChecked: allResults.some(r => r.method === "network"),
        serialChecked: allResults.some(r => r.method === "serial" || r.method === "usb"),
        windowsChecked: allResults.some(r => r.method === "windows"),
        totalAttempts: allResults.length,
      }
    });
  } catch (error: any) {
    console.error("❌ Otomatik algılama hatası:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Otomatik algılama başarısız",
      details: {
        errorType: error.constructor.name,
        errorStack: error.stack,
      }
    }, { status: 500 });
  }
}

---
title: "Exploring I2C Protocols in ESP32"
description: "Basic tutorial for those interested in toying with I/O and sensors in ESP32."
date: 2025-06-01
isPublished: false
tags: ["electronics"]
heroImage: '/images/posts/esp32.png'
heroImageCaption: 'Image by me | Cool looking OLED 😮'
---

Hello! In this project we will try to connect multiple device using I2C Protocol. As we all know, there are three types of protocol that are mainly use in ESP32 projects: I2C, SPI, and UART. The latter is the protocol that ESP32 uses to communicate with our computer (via USB to UART, of course). I will talk mainly about I2C since every device in this project use I2C protocol.

I2C or inter-integrated circuit is a protocol that consists of masters and slaves device. The master device is the one who initiates and control the communication, while the slave is responding to the master. A master device can have multiple slaves. The protocol works by using 2 pins: SCL (clock line) and SDA (data line). The clock line is used to synchronize data transfer while the data line transmits the actual data. Because of this, devices that use I2C Protocol tend to have four pins, consisting of VCC, GND, SCL, and SDA.

The default SCL and SDA pins are GPIO22 and GPIO21 respectively. This works perfectly fine if we only have one slave device, but what if we need more? Thankfully, there are many ways to tackle this issue. The first method is just using the same pin more than once if they have the same bus, but different addresses. For example, BME280 uses 0x76 while OLED 128x64 display uses 0x3C. Therefore, they can communicate just fine using the same pins.

However, there are some cases where we may need the same device more than one. Let’s say, we need two OLED display to display different data. Since we are using the same address, we gonna need another way to tackle this issue. Some device will have a physical switch that you can change by placing resistor to change the address. You can also use I2C Multiplexer like the TCA9548A. However, there is a simpler way, that is by assigning other GPIO pins as SDA and SCL. We will try the latter later in this project. For the meantime, let’s proceed with our project.

# A. Components

Everything you need… minus the BH1750. This project actually doesn’t require that many components, all you need are ESP32, two breadboards, BME280, BH1750, OLED 128x64 display, and a bunch of jumper wires (fourteen of them at least).

You can actually get away with only one breadboard, however that means you will need to leave the ESP32’s pins on the other side hanging outside the breadboard. While it won’t cause any problem on your device, you may accidentally short circuit the ESP32 or even break the pins. Therefore it’s a good idea to grab another breadboard, just to be safe.

# B. Assembling them!

Schematic Diagram of the Project
As we can see from above, this project involves lots of jumper wires. Therefore, I recommend you to use certain colour for certain purpose. In the schematic above, I use red for VIN, black for GND, yellow for SCL, and orange for SDA. Anyway, here is the step by step process.

**1. Put the OLED display and BME280 in place**

![Putting the OLED display and BME280 in place](/images/esp32_1.gif)

Don’t bend the pins.
As you can see it’s fairly straightforward, just make sure it’s not too far from the ESP32. If you place them too far, you may require longer jumper cable to connect the required pins later.

**2. Connect the VIN/3V3 and GND pins**
Give me power!
Connect every VIN/3V3 pins on both device to the 3V3 on the ESP32. After that, connect the GND pins on both device to the GND pin on the ESP32.

3. Connect the SDA and SCL pins for the OLED display

Don’t mix them up
Connect the SCL pin to the D22 pin on the ESP32 using jumper cable. Afterwards, connect the SDA pin to the D21 pin on the ESP32 as well.

4. Connect the SDA and SCL pins for the OLED display

Now for the second device…
Since they are using different address (0x76 vs 0x3C), we can use the same bus. Therefore, we only need to repeat the previous step (on step 3), but this time do it for the BME280's SCL and SDA pins.

5. Upload some code
For the code, you can just copy the code below, full credits to randomnerdtutorials.com.

/*
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/esp32-i2c-communication-arduino-ide/
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files.
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*/

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

Adafruit_BME280 bme;

void setup() {
  Serial.begin(115200);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  
  bool status = bme.begin(0x76);  
  if (!status) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }
  
  delay(2000);
  display.clearDisplay();
  display.setTextColor(WHITE);
}

void loop() {
  display.clearDisplay();
  // display temperature
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("Temperature: ");
  display.setTextSize(2);
  display.setCursor(0,10);
  display.print(String(bme.readTemperature()));
  display.print(" ");
  display.setTextSize(1);
  display.cp437(true);
  display.write(167);
  display.setTextSize(2);
  display.print("C");
  
  // display humidity
  display.setTextSize(1);
  display.setCursor(0, 35);
  display.print("Humidity: ");
  display.setTextSize(2);
  display.setCursor(0, 45);
  display.print(String(bme.readHumidity()));
  display.print(" %"); 
  
  display.display();

  delay(1000);
}
6. You’re done!
After compiling and uploading the code, you should be able to see the value that the BME280 reads on the OLED display.


Hooray!
C. Wait, is that it? No!
Although we have successfully connected both devices to the ESP32, we can still try more things. A perfect example would be to have another sensor: BH1750. Now this sensor is interesting since it measures light intensity in lux, thereby making the testing process extremely easy. Just use your phone flashlight.

1. Connect the BH1750 to the breadboard

On your right…
It is exactly as it sounds, just put it on the breadboard. Make sure not to bend any pins though.

2. Give power to the breadboard and ground it

As fast as the flash?!
Since we are quite far from the ESP32, it’s wiser to just give power to that side of the breadboard. Connect the 3V3 to the positive hole and the GND pin to the negative hole using jumper wires.

3. Connect the BH1750’s SCL and SDA pins

Yeah it’s quite a struggle when you’re dealing with fourteen wires….
Now that the breadboard has power and ground, connect the VCC pin to the positive hole, GND pin to the negative hole, SCL to the D22, SDA to the D21, and ADD to the negative hole.

Honestly, the ADD pin is quite unique. I found some tutorials that state we should not connect the ADD pin. However, from what I found, it doesn’t work for me. Thereby I decided to ground it.

4. It’s another code
The code below is sourced from randomnerdtutorials.com, but I modified the code to suits the project need, namely the addition of BH1750. You can just copy the code below to your Arduino IDE.

/*
  Original code by Rui Santos
  Modified by Rayhan Maheswara Pramanda
  Complete project details at https://RandomNerdTutorials.com/esp32-i2c-communication-arduino-ide/
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files.
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*/

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

Adafruit_BME280 bme;

BH1750 lightMeter;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  
  bool status = bme.begin(0x76);  
  if (!status) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }
  lightMeter.begin();
  delay(2000);
  display.clearDisplay();
  display.setTextColor(WHITE);
}

void loop() {
  display.clearDisplay();
  // display temperature
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("Temperature: ");
  display.setTextSize(1.5);
  display.setCursor(0,10);
  display.print(String(bme.readTemperature()));
  display.print(" ");
  display.setTextSize(1);
  display.cp437(true);
  display.write(167);
  display.setTextSize(1);
  display.print("C");
  
  // display humidity
  display.setTextSize(1);
  display.setCursor(0, 20);
  display.print("Humidity: ");
  display.setTextSize(1);
  display.setCursor(0, 30);
  display.print(String(bme.readHumidity()));
  display.print(" %"); 

  // display light intensity
  uint16_t lux = lightMeter.readLightLevel();
  display.setTextSize(1);
  display.setCursor(0, 40);
  display.print("Light Intensity: ");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.print(String(lux));
  display.print(" lux"); 
  display.display();

  delay(1000);
}
Now, I understand that this isn’t a tutorial about OLED display, but wouldn’t it be fun if we talk about some lines? Let’s go!

The display.setTextSize(1) is a method to set the text size to whatever we want. Remember that we have quite a small screen, so use it wisely. In this case, I set every text to 1 since we need six lines of text to be displayed.

The display.setCursor() is a method to tell the OLED display where to display the text. Since we are using 128x64 pixel display, it wouldn’t be possible to have an X-axis more than 128 or Y-axis more than 64.

The display.print() is a method to print whatever we want to the screen. For the last method, display.display() is a method to tell the OLED to display everything that we have setup before.

5. Wait, something is not right…

Photo by Alexander Krivitskiy on Unsplash
Yes, you’re not hallucinating! If you paid enough attention to the GIF, I didn’t connect the SCL and SDA pin of the BH1750 to the D22 and D21 pins respectively.

Initially, I wanted to try assigning another GPIO pins as SDA and SCL. However, after trying with many combinations (a change in the code and change in the physical pin), I failed to get any successful result. I will show the code below.

/*
  Original code by Rui Santos
  Modified by Rayhan Maheswara Pramanda
  Complete project details at https://RandomNerdTutorials.com/esp32-i2c-communication-arduino-ide/
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files.
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*/

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define SDA_2 33
#define SCL_2 32

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

Adafruit_BME280 bme;

BH1750 lightMeter;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire1.begin(SDA_2, SCL_2);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  
  bool status = bme.begin(0x76, &wire1);  
  if (!status) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }
  lightMeter.begin();
  delay(2000);
  display.clearDisplay();
  display.setTextColor(WHITE);
}

void loop() {
  display.clearDisplay();
  // display temperature
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("Temperature: ");
  display.setTextSize(1.5);
  display.setCursor(0,10);
  display.print(String(bme.readTemperature()));
  display.print(" ");
  display.setTextSize(1);
  display.cp437(true);
  display.write(167);
  display.setTextSize(1);
  display.print("C");
  
  // display humidity
  display.setTextSize(1);
  display.setCursor(0, 20);
  display.print("Humidity: ");
  display.setTextSize(1);
  display.setCursor(0, 30);
  display.print(String(bme.readHumidity()));
  display.print(" %"); 
    
  // display light intensity
  uint16_t lux = lightMeter.readLightLevel();
  display.setTextSize(1);
  display.setCursor(0, 40);
  display.print("Light Intensity: ");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.print(String(lux));
  display.print(" lux"); 
  display.display();

  delay(1000);
}
The code was successfully compiled and uploaded to the ESP32. However, all the sensors are giving the wrong data. The BH1750 is stuck around 200-ish lux while the BME280 is showing a hilariously wrong data (100% humidity with over 180 degree celcius of temperature).

I tried to use the code above, except with changing the SDA_2 and SCL_2 pins to D21 and D22. Funnily enough, it works. But it stopped working as soon as I change the pin to other number.

6. Anyway, here’s the result!

Pardon my hand
As you can see (can you?), the light intensity on the screen is showing different values as I cover the BH1750 and when I illuminate the BH1750 with a phone flashlight.

This project was quite fun, although the problem I described above left me quite frustated. I will happily accept any suggestion as to why it happened and how to fix it. I’m glad it didn’t cause any problem to the functionality of the device whatsoever.

I hope you enjoyed reading this article. See you next time!
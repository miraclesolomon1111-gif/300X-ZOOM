import zlib
import struct
import math

def create_png(width, height, is_maskable=False):
    # Header
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (raw RGBA data)
    raw_data = bytearray()
    cx, cy = width / 2.0, height / 2.0
    r_outer = min(width, height) * (0.38 if is_maskable else 0.44)
    r_inner = r_outer * 0.75
    
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Base dark gradient
            r = int(10 + (y / height) * 6)
            g = int(13 + (y / height) * 8)
            b = int(20 + (y / height) * 12)
            a = 255
            
            # Glowing optic outer ring
            if abs(dist - r_outer) < (width * 0.02):
                # Cyan ring
                r, g, b = 0, 242, 254
            elif dist < r_inner:
                # Inner lens disc
                r, g, b = 20, 28, 42
                if dist < (width * 0.06):
                    # Red lens aperture dot
                    r, g, b = 255, 0, 85
            
            raw_data.extend([r, g, b, a])
            
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    idat_chunk = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png_header + ihdr_chunk + idat_chunk + iend_chunk

# Generate required PWA icons
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(create_png(192, 192, False))

with open('public/pwa-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, False))

with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, True))

with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(create_png(180, 180, False))

print("Icons successfully generated!")

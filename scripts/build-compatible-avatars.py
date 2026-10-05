"""将现有角色资源转成保留透明底的 PNG；不改变人物造型。"""
from io import BytesIO
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = root / 'miniprogram' / 'assets' / 'avatars'
demo = root / 'demo' / 'assets' / 'avatars'
demo.mkdir(parents=True, exist_ok=True)
total = 0
for file in sorted(source.glob('*.webp')):
    with Image.open(file) as original:
        rgba = original.convert('RGBA')
        # 调整调色板数量以兼顾透明度、纹理和微信上传包大小。
        for colors in (256, 128, 64):
            output = BytesIO()
            rgba.quantize(colors=colors, method=Image.Quantize.FASTOCTREE).save(output, format='PNG', optimize=True)
            content = output.getvalue()
            if len(content) <= 30000:
                break
        for folder in (source, demo):
            (folder / (file.stem + '.png')).write_bytes(content)
        total += len(content)
        with Image.open(source / (file.stem + '.png')) as converted:
            converted.verify()
print(f'Converted avatars: 24; PNG bytes: {total}')

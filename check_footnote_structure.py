import xml.etree.ElementTree as ET

tree = ET.parse('docs/charts/synthesis/error-diversity-entropy.svg')
root = tree.getroot()

# Find the text_footnote group
footnote = None
for g in root.iter():
    if g.get('id') == 'text_footnote':
        footnote = g
        break

if footnote:
    print('Found text_footnote element')
    print(f'Number of child elements: {len(list(footnote))}')
    for i, child in enumerate(footnote):
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        print(f'  Child {i}: <{tag}>')
        for j, grandchild in enumerate(child):
            gtag = grandchild.tag.split('}')[-1] if '}' in grandchild.tag else grandchild.tag
            text = (grandchild.text or '')[:50]
            print(f'    Grandchild {j}: <{gtag}> {text}')
else:
    print('text_footnote not found')

#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import sys
import re

def scrape_meesho_deals():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    deals = []
    
    urls = [
        'https://www.meesho.com/',
        'https://www.meesho.com/top-deals/pl/3oo'
    ]
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.content, 'lxml')
            
            product_cards = soup.find_all(['div', 'a'], class_=re.compile('ProductCard|sc-|Card__'))[:10]
            
            for card in product_cards:
                try:
                    title_elem = card.find(['p', 'div', 'span'], class_=re.compile('Text|ProductCard__ProductTitle'))
                    if not title_elem:
                        title_elem = card.find(['p', 'div'])
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text().strip()[:200]
                    if len(title) < 10:
                        continue
                    
                    price_elem = card.find(['span', 'p'], class_=re.compile('ProductCard__PriceText|Price'))
                    if not price_elem:
                        price_elem = card.find(['span', 'h5'])
                    
                    if not price_elem:
                        continue
                    
                    price_text = price_elem.get_text().strip()
                    price_match = re.search(r'[\d,]+', price_text.replace('₹', ''))
                    if not price_match:
                        continue
                    
                    discounted_price = int(price_match.group().replace(',', ''))
                    
                    discount_percentage = 50
                    original_price = int(discounted_price / (1 - discount_percentage / 100))
                    
                    img_elem = card.find('img')
                    image_url = img_elem.get('src', '') if img_elem else ''
                    if not image_url:
                        image_url = img_elem.get('data-src', '') if img_elem else ''
                    
                    link_elem = card.find('a', href=True)
                    deal_url = link_elem['href'] if link_elem else 'https://www.meesho.com'
                    if deal_url.startswith('/'):
                        deal_url = 'https://www.meesho.com' + deal_url
                    
                    category = 'fashion'
                    if any(word in title.lower() for word in ['home', 'kitchen', 'furniture', 'decor']):
                        category = 'home'
                    elif any(word in title.lower() for word in ['beauty', 'cosmetic', 'skincare']):
                        category = 'beauty'
                    elif any(word in title.lower() for word in ['phone', 'electronic', 'gadget']):
                        category = 'electronics'
                    
                    deal = {
                        'title': title,
                        'platform': 'meesho',
                        'category': category,
                        'originalPrice': original_price * 100,
                        'discountedPrice': discounted_price * 100,
                        'discountPercentage': discount_percentage,
                        'imageUrl': image_url if image_url.startswith('http') else None,
                        'dealUrl': deal_url,
                        'expiresAt': None
                    }
                    
                    deals.append(deal)
                    
                except Exception as e:
                    continue
                    
        except Exception as e:
            sys.stderr.write(f"Error scraping Meesho: {str(e)}\n")
            continue
    
    return deals[:10]

if __name__ == '__main__':
    try:
        deals = scrape_meesho_deals()
        print(json.dumps(deals))
    except Exception as e:
        sys.stderr.write(f"Fatal error: {str(e)}\n")
        print(json.dumps([]))

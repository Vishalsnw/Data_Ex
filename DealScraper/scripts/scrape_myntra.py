#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import sys
import re

def scrape_myntra_deals():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    deals = []
    
    urls = [
        'https://www.myntra.com/shop/men',
        'https://www.myntra.com/shop/women'
    ]
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.content, 'lxml')
            
            product_items = soup.find_all(['li'], class_=re.compile('product-base'))[:10]
            
            for item in product_items:
                try:
                    title_elem = item.find(['h3', 'h4'], class_=re.compile('product-brand|product-product'))
                    product_elem = item.find(['h4'], class_=re.compile('product-product'))
                    
                    if not title_elem:
                        continue
                    
                    brand = title_elem.get_text().strip()
                    product_name = product_elem.get_text().strip() if product_elem else ''
                    title = f"{brand} {product_name}".strip()[:200]
                    
                    if len(title) < 5:
                        continue
                    
                    price_elem = item.find(['span', 'div'], class_=re.compile('product-discountedPrice'))
                    old_price_elem = item.find(['span'], class_=re.compile('product-strike'))
                    discount_elem = item.find(['span'], class_=re.compile('product-discountPercentage'))
                    
                    if not price_elem:
                        continue
                    
                    price_text = price_elem.get_text().strip()
                    price_match = re.search(r'[\d,]+', price_text.replace('Rs.', '').replace('₹', ''))
                    if not price_match:
                        continue
                    
                    discounted_price = int(price_match.group().replace(',', ''))
                    
                    original_price = discounted_price
                    if old_price_elem:
                        old_price_text = old_price_elem.get_text().strip()
                        old_price_match = re.search(r'[\d,]+', old_price_text.replace('Rs.', '').replace('₹', ''))
                        if old_price_match:
                            original_price = int(old_price_match.group().replace(',', ''))
                    
                    discount_percentage = 40
                    if discount_elem:
                        disc_text = discount_elem.get_text()
                        disc_match = re.search(r'(\d+)', disc_text)
                        if disc_match:
                            discount_percentage = int(disc_match.group())
                    
                    if original_price == discounted_price and discount_percentage > 0:
                        original_price = int(discounted_price / (1 - discount_percentage / 100))
                    
                    img_elem = item.find('img')
                    image_url = img_elem.get('src', '') if img_elem else ''
                    
                    link_elem = item.find('a', href=True)
                    deal_url = 'https://www.myntra.com' + link_elem['href'] if link_elem and link_elem['href'].startswith('/') else 'https://www.myntra.com'
                    
                    category = 'fashion'
                    
                    deal = {
                        'title': title,
                        'platform': 'myntra',
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
            sys.stderr.write(f"Error scraping Myntra: {str(e)}\n")
            continue
    
    return deals[:10]

if __name__ == '__main__':
    try:
        deals = scrape_myntra_deals()
        print(json.dumps(deals))
    except Exception as e:
        sys.stderr.write(f"Fatal error: {str(e)}\n")
        print(json.dumps([]))

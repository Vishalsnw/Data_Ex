#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import sys
import re

def scrape_flipkart_deals():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    deals = []
    
    urls = [
        'https://www.flipkart.com/offers-list/content?screen=dynamic&pk=themeViews%3DDeal_of_the_day~widgetType%3DdealCard~contentType%3Dneo&wid=2.dealCard.OMU4_',
        'https://www.flipkart.com/offers-store'
    ]
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.content, 'lxml')
            
            product_cards = soup.find_all(['div', 'a'], class_=re.compile('_1AtVbE|_2kHMtA|_13oc-S'))[:15]
            
            for card in product_cards:
                try:
                    title_elem = card.find(['div', 'a'], class_=re.compile('_4rR01T|IRpwTa|s1Q9rs'))
                    if not title_elem:
                        title_elem = card.find(['div', 'span', 'a'])
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text().strip()[:200]
                    if len(title) < 10:
                        continue
                    
                    price_elem = card.find(['div'], class_=re.compile('_30jeq3|_3I9_wc'))
                    old_price_elem = card.find(['div'], class_=re.compile('_3Djpdu|_3I9_wc'))
                    discount_elem = card.find(['div', 'span'], class_=re.compile('_3Ay6sb|_3xFhiH'))
                    
                    if not price_elem:
                        continue
                    
                    price_text = price_elem.get_text().strip()
                    price_match = re.search(r'[\d,]+', price_text.replace('₹', ''))
                    if not price_match:
                        continue
                    
                    discounted_price = int(price_match.group().replace(',', ''))
                    
                    original_price = discounted_price
                    if old_price_elem:
                        old_price_text = old_price_elem.get_text().strip()
                        old_price_match = re.search(r'[\d,]+', old_price_text.replace('₹', ''))
                        if old_price_match:
                            original_price = int(old_price_match.group().replace(',', ''))
                    
                    discount_percentage = 25
                    if discount_elem:
                        disc_text = discount_elem.get_text()
                        disc_match = re.search(r'(\d+)', disc_text)
                        if disc_match:
                            discount_percentage = int(disc_match.group())
                    
                    if original_price == discounted_price:
                        original_price = int(discounted_price / (1 - discount_percentage / 100))
                    
                    img_elem = card.find('img')
                    image_url = img_elem.get('src', '') if img_elem else ''
                    
                    link_elem = card.find('a', href=True)
                    deal_url = 'https://www.flipkart.com' + link_elem['href'] if link_elem and link_elem['href'].startswith('/') else 'https://www.flipkart.com'
                    
                    category = 'electronics'
                    if any(word in title.lower() for word in ['cloth', 'shirt', 'dress', 'shoe', 'jean', 'saree', 'kurta']):
                        category = 'fashion'
                    elif any(word in title.lower() for word in ['home', 'kitchen', 'furniture', 'decor']):
                        category = 'home'
                    elif any(word in title.lower() for word in ['beauty', 'cosmetic', 'skincare']):
                        category = 'beauty'
                    elif any(word in title.lower() for word in ['sport', 'fitness', 'gym']):
                        category = 'sports'
                    elif any(word in title.lower() for word in ['book']):
                        category = 'books'
                    
                    deal = {
                        'title': title,
                        'platform': 'flipkart',
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
            sys.stderr.write(f"Error scraping Flipkart: {str(e)}\n")
            continue
    
    return deals[:15]

if __name__ == '__main__':
    try:
        deals = scrape_flipkart_deals()
        print(json.dumps(deals))
    except Exception as e:
        sys.stderr.write(f"Fatal error: {str(e)}\n")
        print(json.dumps([]))

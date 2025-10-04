#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import sys
import re

def scrape_amazon_deals():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    deals = []
    
    urls = [
        'https://www.amazon.in/gp/goldbox',
        'https://www.amazon.in/deals'
    ]
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
                
            soup = BeautifulSoup(response.content, 'lxml')
            
            deal_elements = soup.find_all(['div', 'span'], class_=re.compile('DealCard|dealCard|deal'))[:10]
            
            for element in deal_elements:
                try:
                    title_elem = element.find(['span', 'div', 'h2'], class_=re.compile('title|DealTitle'))
                    if not title_elem:
                        title_elem = element.find(['a'])
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text().strip()[:200]
                    if len(title) < 10:
                        continue
                    
                    price_elem = element.find(['span', 'div'], class_=re.compile('price|Price'))
                    discount_elem = element.find(['span', 'div'], class_=re.compile('discount|Discount|savingsPercentage'))
                    
                    if not price_elem:
                        continue
                    
                    price_text = price_elem.get_text().strip()
                    price_match = re.search(r'[\d,]+', price_text.replace('₹', ''))
                    if not price_match:
                        continue
                    
                    discounted_price = int(price_match.group().replace(',', ''))
                    
                    discount_percentage = 30
                    if discount_elem:
                        disc_text = discount_elem.get_text()
                        disc_match = re.search(r'(\d+)', disc_text)
                        if disc_match:
                            discount_percentage = int(disc_match.group())
                    
                    original_price = int(discounted_price / (1 - discount_percentage / 100))
                    
                    img_elem = element.find('img')
                    image_url = img_elem.get('src', '') if img_elem else ''
                    
                    link_elem = element.find('a', href=True)
                    deal_url = 'https://www.amazon.in' + link_elem['href'] if link_elem and link_elem['href'].startswith('/') else 'https://www.amazon.in'
                    
                    category = 'electronics'
                    if any(word in title.lower() for word in ['cloth', 'shirt', 'dress', 'shoe', 'jean', 'fashion']):
                        category = 'fashion'
                    elif any(word in title.lower() for word in ['home', 'kitchen', 'furniture', 'decor']):
                        category = 'home'
                    elif any(word in title.lower() for word in ['beauty', 'cosmetic', 'skincare']):
                        category = 'beauty'
                    elif any(word in title.lower() for word in ['sport', 'fitness', 'gym', 'yoga']):
                        category = 'sports'
                    elif any(word in title.lower() for word in ['book']):
                        category = 'books'
                    
                    deal = {
                        'title': title,
                        'platform': 'amazon',
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
            sys.stderr.write(f"Error scraping Amazon: {str(e)}\n")
            continue
    
    return deals[:15]

if __name__ == '__main__':
    try:
        deals = scrape_amazon_deals()
        print(json.dumps(deals))
    except Exception as e:
        sys.stderr.write(f"Fatal error: {str(e)}\n")
        print(json.dumps([]))

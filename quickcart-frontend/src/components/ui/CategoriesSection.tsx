import { Link } from 'react-router-dom';

interface CategoryCard {
  title: string;
  image: string;
  link: string;
}

const categories: CategoryCard[] = [
  {
    title: 'Accessories',
    image: 'https://corporate.jaihindretail.com/images/Collections/Accessories/Accessories.jpg',
    link: '/products?category=Accessories'
  },
  {
    title: 'Beauty',
    image: 'http://www.mommygearest.com/wp-content/uploads/2017/10/best-beauty-products-2017-1024x768.jpg',
    link: '/products?category=Beauty'
  },
  {
    title: 'Books',
    image: 'https://images.hindustantimes.com/rf/image_size_960x540/HT/p2/2017/08/09/Pictures/stack-spines-books-on-book-shelf-multicolored_a2fae948-7d1f-11e7-ba32-a280bea68af6.jpg',
    link: '/products?category=Books'
  },
  {
    title: 'Clothing',
    image: 'https://static.independent.co.uk/2023/04/06/16/online%20clothes%20shop%20directory%20indybest.jpg',
    link: '/products?category=Clothing'
  },
  {
    title: 'Electronics',
    image: 'https://usercontent1.hubstatic.com/8610166_f1024.jpg',    
    link: '/products?category=Electronics'
  },
  {
    title: 'Footwear',
    image: 'https://www.india.com/wp-content/uploads/2017/08/footwear.jpg',
    link: '/products?category=Footwear'
  },
  {
    title: 'Grocery',
    image: 'https://storage.googleapis.com/gen-atmedia/3/2018/01/2d4ea32ed14a1f75cf1b454748dfa99cd4a1fa62.jpeg',
    link: '/products?category=Grocery'
  },
  {
    title: 'Home & Kitchen',
    image: 'https://imageio.forbes.com/specials-images/imageserve/635f79d36783ca7b82046fed/0x0.jpg?format=jpg&crop=1337,1003,x71,y0,safe&width=1200',
    link: '/products?category=Home+%26+Kitchen'
  },
  {
    title: 'Sports',
    image: 'https://sportsmatik.com/uploads/sports-corner/equipment-bn.jpg',
    link: '/products?category=Sports'
  },
  {
    title: 'Toys',
    image: 'https://imgix-prod.sgs.com/-/media/sgscorp/images/connectivity-and-products/children-toys.cdn.en-TH.1.jpg?fit=crop&crop=edges&auto=format&w=1200&h=630',
    link: '/products?category=Toys'
  }
];

// CSS classes for hiding scrollbar across browsers
const hideScrollbarStyles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function CategoriesSection() {
  return (
    <div className="bg-white py-4 rounded-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">CATEGORIES TO BAG</h2>
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-4 min-w-max">
            {categories.map((category, index) => (
              <Link key={index} to={category.link} className="group flex-shrink-0" style={{ width: '120px' }}>
                <div className="flex flex-col items-center">
                  <div className="overflow-hidden rounded-full mb-2 w-full aspect-square border border-gray-200" style={{ height: '80px', width: '80px' }}>
                    <img 
                      src={category.image} 
                      alt={category.title} 
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  </div>
                  <span className="text-center text-sm font-medium text-gray-800">{category.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyles }} />
    </div>
  );
} 
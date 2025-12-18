import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Star, ShoppingCart, Users, CheckCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';

const MarketplaceHome = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const featuredCategories = [
    { name: 'Healthcare AI', count: 24, icon: '🏥' },
    { name: 'Financial Analytics', count: 18, icon: '💰' },
    { name: 'Marketing Automation', count: 32, icon: '📈' },
    { name: 'Legal Tech', count: 15, icon: '⚖️' }
  ];

  const featuredTools = [
    {
      id: '1',
      name: 'MedAI Diagnostics',
      vendor: 'HealthTech Solutions',
      category: 'Healthcare AI',
      rating: 4.8,
      verified: true,
      description: 'FDA-compliant medical imaging AI for diagnostic assistance'
    },
    {
      id: '2', 
      name: 'FinanceBot Pro',
      vendor: 'DataFlow Systems',
      category: 'Financial Analytics',
      rating: 4.6,
      verified: true,
      description: 'SOX-compliant financial analytics and reporting automation'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            AI Tools Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover, evaluate, and deploy compliance-ready AI tools for your enterprise
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search AI tools, vendors, or categories..."
              className="pl-12 h-14 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              className="absolute right-2 top-2 h-10"
              onClick={() => navigate('/marketplace/tools')}
            >
              Search
            </Button>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button size="lg" onClick={() => navigate('/marketplace/tools')}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Browse Tools
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/vendor/tools')}>
              <Users className="mr-2 h-5 w-5" />
              Submit Your Tool
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category) => (
              <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/marketplace/categories?category=${category.name}`)}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} tools available</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Tools</h2>
            <Button variant="outline" onClick={() => navigate('/marketplace/tools')}>
              View All Tools
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {featuredTools.map((tool) => (
              <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{tool.name}</CardTitle>
                      <p className="text-muted-foreground">{tool.vendor}</p>
                    </div>
                    {tool.verified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{tool.category}</Badge>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">{tool.rating}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/marketplace/tools/${tool.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">150+</div>
              <p className="text-muted-foreground">Verified AI Tools</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Trusted Vendors</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99%</div>
              <p className="text-muted-foreground">Compliance Rate</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketplaceHome;
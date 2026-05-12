import Layout from '../components/layout/Layout'
import HomeHero from '../components/home/HomeHero'
import FeatureGrid from '../components/home/FeatureGrid'
import ProcessSection from '../components/home/ProcessSection'
import PreviewGrid from '../components/home/PreviewGrid'
import HomeFooter from '../components/home/HomeFooter'

export default function HomePage() {
  return (
    <Layout>
      <HomeHero />
      <FeatureGrid />
      <ProcessSection />
      <PreviewGrid />
      <HomeFooter />
    </Layout>
  )
}
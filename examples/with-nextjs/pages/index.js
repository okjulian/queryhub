import Link from 'next/link';
import { GraphQLClient } from 'graphql-request';

export async function getStaticProps() {
  const graphcms = new GraphQLClient(
    'https://api-eu-central-1.graphcms.com/v2/ck8sn5tnf01gc01z89dbc7s0o/master'
  );

  const { products } = await graphcms.request(
    `
      { 
        products {
          slug
          name
        }
      }
    `
  );

  return {
    props: {
      products,
    },
  };
}

export default ({ products }) => (
  <ul>
    {products.map(({ slug, name }) => (
      <li key={name}>
        <Link key={slug} href={`/products/${slug}`}>
          <a>{name}</a>
        </Link>
      </li>
    ))}
  </ul>
);

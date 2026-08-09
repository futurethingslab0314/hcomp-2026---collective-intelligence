
export interface AwardedPaper {
  title: string;
  authors: string;
}

export interface PastYearAwards {
  bestPaper?: AwardedPaper;
  honorableMentions?: AwardedPaper[];
}

export interface PastMeeting {
  year: number;
  location: string;
  theme: string;
  website: string;
  proceedings: string;
  awards?: PastYearAwards;
}

export const PAST_HCOMP_MEETINGS: PastMeeting[] = [
  {
    year: 2024,
    location: "Online / Hybrid",
    theme: "Investigating What Factors Influence Users' Rating of Harmful Algorithmic Bias and Discrimination",
    website: "https://humancomputation.com/2024/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/588",
    awards: {
      bestPaper: {
        title: "Investigating What Factors Influence Users' Rating of Harmful Algorithmic Bias and Discrimination",
        authors: "Sara Kingsley, Jiayin Zhi, Wesley Hanwen Deng, Jaimie Lee, Sizhe Zhang, Motahhare Eslami, Kenneth Holstein, Jason I. Hong, Tianshi Li and Hong Shen"
      },
      honorableMentions: [
        {
          title: "The Atlas of AI Risks: Enhancing Public Understanding of AI Risks",
          authors: "Edyta Bogucka, Sanja Scepanovic and Daniele Quercia"
        },
        {
          title: "Utility-Oriented Knowledge Graph Accuracy Estimation with Limited Annotations: A Case Study on DBpedia",
          authors: "Stefano Marchesin, Gianmaria Silvello and Omar Alonso"
        }
      ]
    }
  },
  {
    year: 2023,
    location: "Delft, Netherlands",
    theme: "Collaboration in the Age of Generative AI",
    website: "https://humancomputation.com/2023/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/522",
    awards: {
      bestPaper: {
        title: "To Be or Not To Be: Understanding the Impact of Gender-Neutral Language on Crowdworkers",
        authors: "Anke M. van der Meulen, et al."
      }
    }
  },
  {
    year: 2022,
    location: "Online",
    theme: "Human-AI Collaboration",
    website: "https://humancomputation.com/2022/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/468",
  },
  {
    year: 2021,
    location: "Online",
    theme: "Trustworthy Human-AI Systems",
    website: "https://humancomputation.com/2021/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/380",
  },
  {
    year: 2020,
    location: "Online",
    theme: "Human Computation for Social Good",
    website: "https://humancomputation.com/2020/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/321",
  },
  {
    year: 2019,
    location: "Washington DC, USA",
    theme: "Integrating Human and Machine Intelligence",
    website: "https://humancomputation.com/2019/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/178",
  },
  {
    year: 2018,
    location: "Zurich, Switzerland",
    theme: "Human Computation and Crowdsourcing",
    website: "https://humancomputation.com/2018/",
    proceedings: "https://ojs.aaai.org/index.php/HCOMP/issue/view/100",
  },
  {
    year: 2017,
    location: "Quebec City, Canada",
    theme: "Human-Machine Symbiosis",
    website: "https://humancomputation.com/2017/",
    proceedings: "https://aaai.org/Library/HCOMP/hcomp17contents.php",
  },
  {
    year: 2016,
    location: "Austin, TX, USA",
    theme: "Hybrid Intelligence",
    website: "https://humancomputation.com/2016/",
    proceedings: "https://aaai.org/Library/HCOMP/hcomp16contents.php",
  },
  {
    year: 2015,
    location: "San Diego, CA, USA",
    theme: "Gamification and Incentives",
    website: "https://humancomputation.com/2015/",
    proceedings: "https://aaai.org/Library/HCOMP/hcomp15contents.php",
  },
  {
    year: 2014,
    location: "Pittsburgh, PA, USA",
    theme: "Social and Collaborative Computing",
    website: "https://humancomputation.com/2014/",
    proceedings: "https://aaai.org/Library/HCOMP/hcomp14contents.php",
  },
  {
    year: 2013,
    location: "Palm Springs, CA, USA",
    theme: "Foundations of Human Computation",
    website: "https://humancomputation.com/2013/",
    proceedings: "https://aaai.org/Library/HCOMP/hcomp13contents.php",
  },
  {
    year: 2012,
    location: "Toronto, Canada",
    theme: "AAAI Workshop",
    website: "https://aaai.org/Workshops/ws12.php",
    proceedings: "https://aaai.org/Library/Workshops/ws12-08.php",
  },
  {
    year: 2011,
    location: "San Francisco, CA, USA",
    theme: "AAAI Workshop",
    website: "https://aaai.org/Workshops/ws11.php",
    proceedings: "https://aaai.org/Library/Workshops/ws11-11.php",
  },
  {
    year: 2010,
    location: "Atlanta, GA, USA",
    theme: "AAAI Workshop",
    website: "https://aaai.org/Workshops/ws10.php",
    proceedings: "https://aaai.org/Library/Workshops/ws10-02.php",
  },
  {
    year: 2009,
    location: "Paris, France",
    theme: "KDD Workshop",
    website: "http://www.humancomputation.com/2009/",
    proceedings: "https://dl.acm.org/doi/proceedings/10.1145/1600150",
  }
];

export const PAST_REPORTS = [
  {
    citation: "Workshops Held at the First AAAI Conference on Human Computation and Crowdsourcing: A Report. Tatiana Josephy, Matthew Lease, Praveen Paritosh, Markus Krause, Mihai Georgescu, Michael Tjalve, and Daniela Braga. AI Magazine, 35(2), 75-78, 2014.",
    link: "https://ojs.aaai.org/index.php/aimagazine/article/view/2539"
  },
  {
    citation: "Shar Steed. Harnessing Human Intellect for Computing. Computing Research Association (CRA) Computing Research News, Vol. 25 No. 2, Feburary 2013.",
    link: "https://cra.org/crn/2013/02/harnessing-human-intellect-for-computing/"
  },
  {
    citation: "A report on the human computation workshop (HCOMP 2009). Panagiotis G. Ipeirotis, Raman Chandrasekar, and Paul N. Bennett. SIGKDD Explorations 11, no. 2 (2009): 80-83.",
    link: "https://dl.acm.org/doi/10.1145/1809400.1809419"
  }
];

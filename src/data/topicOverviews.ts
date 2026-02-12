// Topic overviews for the A-Level Maths curriculum
// These provide context-specific introductions when a student selects a topic

export interface TopicOverview {
  title: string;
  description: string;
  keyPoints: string[];
  examTip?: string;
}

export const topicOverviews: Record<string, TopicOverview> = {
  // Pure Mathematics
  'proof': {
    title: 'Proof',
    description: 'Mathematical proof is the foundation of all mathematics. In this topic, you\'ll learn how to construct rigorous arguments that demonstrate why mathematical statements are true (or false). This is essential for developing logical thinking and is tested throughout the A-Level syllabus.',
    keyPoints: [
      'Proof by deduction - using logical steps from known facts',
      'Proof by exhaustion - checking all possible cases',
      'Disproof by counter example - finding one case that breaks a claim'
    ],
    examTip: 'Always clearly state what you\'re assuming and what you\'re proving. Show every logical step.'
  },
  'algebra-functions': {
    title: 'Algebra and Functions',
    description: 'This topic builds on your GCSE algebra knowledge and introduces more powerful techniques. You\'ll master manipulating expressions, solving complex equations, and understanding how functions behave. These skills underpin almost every other topic in A-Level Maths.',
    keyPoints: [
      'Laws of indices and working with surds',
      'Quadratic functions and completing the square',
      'Solving linear and quadratic inequalities',
      'Factor theorem and polynomial division'
    ],
    examTip: 'Practice manipulating expressions quickly and accurately - algebraic fluency saves time in exams.'
  },
  'coordinate-geometry': {
    title: 'Coordinate Geometry',
    description: 'Coordinate geometry connects algebra with geometry, allowing you to describe shapes and lines using equations. You\'ll learn to work with straight lines, circles, and parametric curves, developing skills that are essential for calculus and mechanics.',
    keyPoints: [
      'Equations of straight lines and their properties',
      'Circle equations and finding intersections',
      'Parametric equations and converting between forms'
    ],
    examTip: 'Draw clear diagrams and label key points - visualisation helps spot relationships.'
  },
  'sequences-series': {
    title: 'Sequences and Series',
    description: 'Sequences and series are about patterns in numbers. You\'ll learn to describe patterns algebraically, sum long sequences efficiently, and use the powerful binomial expansion. These techniques appear in probability, finance, and advanced calculus.',
    keyPoints: [
      'Arithmetic and geometric sequences and series',
      'Sigma notation for sums',
      'Binomial expansion and its applications'
    ],
    examTip: 'Memorise the sum formulas and know when to apply each type.'
  },
  'trigonometry': {
    title: 'Trigonometry',
    description: 'A-Level trigonometry goes far beyond triangles. You\'ll work with trigonometric identities, solve complex equations, and explore reciprocal and inverse functions. This topic is crucial for calculus, mechanics, and many real-world applications.',
    keyPoints: [
      'Trigonometric identities and proving them',
      'Solving trigonometric equations in radians',
      'Reciprocal functions (sec, cosec, cot)',
      'Inverse trigonometric functions'
    ],
    examTip: 'Learn the key identities by heart - you\'ll need them frequently in integration.'
  },
  'exponentials-logarithms': {
    title: 'Exponentials and Logarithms',
    description: 'Exponentials and logarithms are inverses of each other and model many real-world phenomena like population growth and radioactive decay. Mastering the laws of logarithms and exponential equations is essential for later calculus work.',
    keyPoints: [
      'Laws of logarithms and changing base',
      'Solving exponential and logarithmic equations',
      'The natural logarithm (ln) and e',
      'Modelling with exponential functions'
    ],
    examTip: 'Remember: log(ab) = log(a) + log(b) and log(a^n) = n·log(a).'
  },
  'differentiation': {
    title: 'Differentiation',
    description: 'Differentiation is one of the two pillars of calculus. It\'s about rates of change - how fast things are changing at any instant. You\'ll learn techniques like the chain rule, product rule, and implicit differentiation that are essential for mechanics and optimisation.',
    keyPoints: [
      'First principles and standard derivatives',
      'Chain rule, product rule, and quotient rule',
      'Implicit and parametric differentiation',
      'Applications: tangents, normals, optimisation'
    ],
    examTip: 'Practice the chain rule until it\'s automatic - it appears everywhere.'
  },
  'integration': {
    title: 'Integration',
    description: 'Integration is the reverse of differentiation and is used to find areas, volumes, and solve differential equations. You\'ll learn powerful techniques like substitution and integration by parts that unlock solutions to complex problems.',
    keyPoints: [
      'Standard integrals and reverse chain rule',
      'Integration by substitution',
      'Integration by parts',
      'Solving differential equations'
    ],
    examTip: 'Always include the constant of integration (+C) unless you have boundary conditions.'
  },
  'numerical-methods': {
    title: 'Numerical Methods',
    description: 'Many equations can\'t be solved exactly, so we need numerical methods to find approximate solutions. You\'ll learn how to locate roots, use the Newton-Raphson method, and approximate integrals using the trapezium rule.',
    keyPoints: [
      'Change of sign methods for locating roots',
      'Newton-Raphson iteration formula',
      'Trapezium rule for numerical integration'
    ],
    examTip: 'Show your working clearly and state the accuracy of your answers.'
  },
  'vectors': {
    title: 'Vectors',
    description: 'Vectors describe quantities with both magnitude and direction. They\'re fundamental to mechanics and 3D geometry. You\'ll learn vector arithmetic, the scalar product, and how to describe lines in 3D space.',
    keyPoints: [
      'Vector addition, subtraction, and scalar multiplication',
      'Scalar (dot) product and finding angles',
      'Vector equations of lines in 2D and 3D'
    ],
    examTip: 'Draw diagrams for vector problems - they help visualise the geometry.'
  },

  // Statistics
  'statistical-sampling': {
    title: 'Statistical Sampling',
    description: 'In the real world, we often can\'t study entire populations, so we take samples. This topic teaches you how to select representative samples and understand the limitations of sampling methods.',
    keyPoints: [
      'Populations, samples, and census',
      'Random, systematic, and stratified sampling',
      'Advantages and limitations of each method'
    ],
    examTip: 'Be able to explain why a particular sampling method is appropriate for a given context.'
  },
  'data-presentation': {
    title: 'Data Presentation and Interpretation',
    description: 'Representing data visually and calculating summary statistics helps us understand patterns and make comparisons. You\'ll work with histograms, box plots, and measures of central tendency and spread.',
    keyPoints: [
      'Histograms and frequency density',
      'Box plots and comparing distributions',
      'Mean, median, mode, and standard deviation'
    ],
    examTip: 'Know how to interpret data in context - examiners love application questions.'
  },
  'probability': {
    title: 'Probability',
    description: 'Probability quantifies uncertainty. You\'ll study probability distributions including the crucial binomial and normal distributions, which model many real-world situations from quality control to medical testing.',
    keyPoints: [
      'Probability rules and tree diagrams',
      'Binomial distribution and its conditions',
      'Normal distribution and standardisation'
    ],
    examTip: 'Check conditions for binomial (fixed n, constant p, independent trials).'
  },
  'hypothesis-testing': {
    title: 'Hypothesis Testing',
    description: 'Hypothesis testing lets us make data-driven decisions. You\'ll learn to set up hypotheses, calculate test statistics, and interpret results to determine whether evidence supports a claim.',
    keyPoints: [
      'Null and alternative hypotheses',
      'Significance levels and critical regions',
      'Correlation and regression'
    ],
    examTip: 'Always state your conclusion in context, not just "reject H₀".'
  },

  // Mechanics
  'kinematics': {
    title: 'Kinematics',
    description: 'Kinematics describes motion without considering what causes it. You\'ll work with the SUVAT equations, velocity-time graphs, and extend to 2D motion with projectiles.',
    keyPoints: [
      'SUVAT equations for constant acceleration',
      'Interpreting velocity-time and displacement-time graphs',
      'Projectile motion in 2D'
    ],
    examTip: 'Choose your SUVAT equation based on what you know and what you need.'
  },
  'forces-newtons-laws': {
    title: 'Forces and Newton\'s Laws',
    description: 'Newton\'s laws explain why objects move the way they do. You\'ll learn to draw force diagrams, resolve forces into components, and apply F=ma to solve problems involving connected particles.',
    keyPoints: [
      'Drawing and interpreting force diagrams',
      'Resolving forces in perpendicular directions',
      'Connected particles and pulleys'
    ],
    examTip: 'Always draw a clear force diagram before writing equations.'
  },
  'projectiles': {
    title: 'Projectiles',
    description: 'Projectile motion combines horizontal and vertical motion. Objects follow parabolic paths under gravity alone. You\'ll learn to analyse trajectories and find ranges, maximum heights, and flight times.',
    keyPoints: [
      'Separating horizontal and vertical components',
      'Time of flight and range calculations',
      'Maximum height and trajectory equations'
    ],
    examTip: 'Horizontal velocity is constant; vertical velocity changes due to g.'
  },
  'moments': {
    title: 'Moments',
    description: 'Moments measure the turning effect of forces. This topic covers equilibrium of rigid bodies, including beams, ladders, and hinged structures. It\'s essential for engineering and physics applications.',
    keyPoints: [
      'Calculating moments about a point',
      'Equilibrium conditions for rigid bodies',
      'Problems involving non-uniform rods and supports'
    ],
    examTip: 'Take moments about a point where unknown forces act to simplify equations.'
  }
};

export const getTopicOverview = (topicId: string): TopicOverview | null => {
  return topicOverviews[topicId] || null;
};

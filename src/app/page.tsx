'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Badge,
  useToast,
  Center,
  SlideFade,
} from '@chakra-ui/react';
import { songs, Song } from '@/data/songs';

// Function to get a random song
const getRandomSong = (usedSongs: Set<number>): [Song, Set<number>] => {
  if (usedSongs.size === songs.length) {
    // All songs have been used, reset the set
    usedSongs.clear();
  }

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * songs.length);
  } while (usedSongs.has(randomIndex));

  usedSongs.add(randomIndex);
  return [songs[randomIndex], usedSongs];
};

// Add this function at the top of the file, after imports
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Create matrix of zeros
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(0));

  // Fill first row and column
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  // Fill rest of matrix
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  // Calculate similarity percentage
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return (1 - distance / maxLength) * 100;
}

export default function Home() {
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song>(songs[0]);
  const [usedSongs, setUsedSongs] = useState<Set<number>>(new Set());
  const toast = useToast();
  const [isGameOver, setIsGameOver] = useState(false);

  // Timer effect with cleanup
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setShowAnswer(true);
      toast({
        title: "Time's up!",
        description: "Better luck next time!",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft, isActive, toast]);

  const handleStart = () => {
    const [newSong, newUsedSongs] = getRandomSong(usedSongs);
    setCurrentSong(newSong);
    setUsedSongs(newUsedSongs);
    setGameStarted(true);
    setIsActive(true);
    setTimeLeft(30);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) return;

    const similarity = calculateStringSimilarity(guess, currentSong.answer);
    const isCloseEnough = similarity >= 80; // 80% similarity threshold

    if (guess.toLowerCase() === currentSong.answer.toLowerCase() || isCloseEnough) {
      const pointsEarned = hints.length === 0 ? 10 : hints.length === 1 ? 7 : 5;
      setScore(prevScore => prevScore + pointsEarned);
      setIsActive(false);
      setShowAnswer(true);
      setIsCorrect(true);
      
      // Show different toast messages based on exact match or close match
      if (isCloseEnough && guess.toLowerCase() !== currentSong.answer.toLowerCase()) {
        toast({
          title: "Close enough!",
          description: `The exact answer was "${currentSong.answer}". You earned ${pointsEarned} points!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Correct!",
          description: `You earned ${pointsEarned} points!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } else if (similarity >= 60) { // If answer is somewhat close
      toast({
        title: "Almost there!",
        description: "You're getting close, try again!",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Incorrect!",
        description: "Try again or use a hint",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
    setGuess('');
  };

  const handleHint = () => {
    if (hints.length === 0) {
      setHints([`Singer: ${currentSong.artist}`]);
    } else if (hints.length === 1) {
      setHints([...hints, `Album: ${currentSong.album}`]);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    setShowAnswer(true);
    setIsCorrect(false);
  };

  const handleNext = () => {
    if (usedSongs.size === songs.length) {
      setIsGameOver(true);
      return;
    }
    
    const [newSong, newUsedSongs] = getRandomSong(usedSongs);
    setCurrentSong(newSong);
    setUsedSongs(newUsedSongs);
    setShowAnswer(false);
    setHints([]);
    setTimeLeft(30);
    setIsActive(true);
    setIsCorrect(false);
    setGuess('');
    setGameStarted(true);  // Keep the game in started state
  };

  return (
    <Box minH="100vh" bg="linear-gradient(to bottom, #1a365d, #000000)" py={8}>
      <Container maxW="container.sm">
        {isGameOver ? (
          <Center minH="80vh">
            <VStack spacing={8}>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, purple.400, pink.500)"
                bgClip="text"
                textAlign="center"
              >
                Game Over!
              </Heading>
              <Text
                fontSize="6xl"
                fontWeight="bold"
                color="white"
              >
                Final Score: {score}
              </Text>
              <Button
                onClick={() => {
                  setIsGameOver(false);
                  setScore(0);
                  setUsedSongs(new Set());
                  setGameStarted(false);
                  setHints([]);
                  setShowAnswer(false);
                  setIsActive(false);
                  setTimeLeft(30);
                  setGuess('');
                  setIsCorrect(false);
                  setCurrentSong(songs[0]);
                }}
                size="lg"
                colorScheme="green"
              >
                Play Again
              </Button>
            </VStack>
          </Center>
        ) : (
          <VStack gap={8}>
            {/* Header */}
            <Box textAlign="center">
              <Heading
                as="h1"
                size="xl"
                bgGradient="linear(to-r, purple.400, pink.500)"
                bgClip="text"
              >
                Bollywood Lyrics Quiz
              </Heading>
              <Text color="whiteAlpha.800" mt={2}>
                Guess the song from its English lyrics!
              </Text>
            </Box>

            {/* Score and Progress Display */}
            <HStack spacing={4}>
              <Badge
                px={6}
                py={2}
                borderRadius="full"
                colorScheme="purple"
                fontSize="md"
              >
                Score: {score}
              </Badge>
              <Badge
                px={6}
                py={2}
                borderRadius="full"
                colorScheme="blue"
                fontSize="md"
              >
                Songs: {usedSongs.size}/{songs.length}
              </Badge>
            </HStack>

            {!gameStarted ? (
              <Center p={8}>
                <Button
                  onClick={handleStart}
                  size="lg"
                  colorScheme="green"
                >
                  ▶️ Play Round
                </Button>
              </Center>
            ) : (
              <VStack gap={4} width="100%">
                {/* Add End Game button in top section */}
                <Box position="relative" width="100%">
                  <Button
                    position="absolute"
                    left={0}
                    top={0}
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    _hover={{ bg: 'gray.700' }}
                    onClick={() => setIsGameOver(true)}
                  >
                    End Game
                  </Button>
                </Box>

                {/* Timer Display */}
                <Badge
                  px={6}
                  py={2}
                  borderRadius="full"
                  colorScheme={timeLeft > 10 ? "green" : "red"}
                  fontSize="md"
                >
                  Time: {timeLeft}s
                </Badge>

                {/* Lyrics Display */}
                <SlideFade in={true} offsetY="20px">
                  <Box
                    bg="whiteAlpha.100"
                    p={6}
                    borderRadius="lg"
                    boxShadow="xl"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    transition="transform 0.2s"
                    _hover={{ transform: 'scale(1.02)' }}
                  >
                    <Text
                      whiteSpace="pre-wrap"
                      fontSize="lg"
                      fontWeight="medium"
                      color="whiteAlpha.900"
                      textAlign="center"
                    >
                      {currentSong.english_lyrics}
                    </Text>
                  </Box>
                </SlideFade>

                {/* Hints Display */}
                {hints.length > 0 && (
                  <VStack spacing={2} width="100%">
                    {hints.map((hint, index) => (
                      <Text
                        key={index}
                        color="yellow.200"
                        fontSize="md"
                        textAlign="center"
                      >
                        {hint}
                      </Text>
                    ))}
                  </VStack>
                )}

                {/* Game Controls */}
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <HStack width="100%">
                    <Input
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder="Enter song name..."
                      bg="whiteAlpha.100"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      _hover={{ borderColor: 'purple.400' }}
                      _focus={{ borderColor: 'purple.500', boxShadow: 'none' }}
                      isDisabled={!isActive}
                    />
                    <Button
                      type="submit"
                      colorScheme="purple"
                      px={8}
                      isDisabled={!isActive}
                    >
                      Submit
                    </Button>
                  </HStack>
                </form>

                {/* Action Buttons - remove End Game from here */}
                <HStack gap={4}>
                  <Button
                    onClick={handleHint}
                    variant="ghost"
                    colorScheme="yellow"
                    _hover={{ bg: 'yellow.700' }}
                    isDisabled={!isActive || hints.length >= 2}
                  >
                    Hint ({2 - hints.length} left)
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    colorScheme="red"
                    _hover={{ bg: 'red.700' }}
                    isDisabled={!isActive}
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="ghost"
                    colorScheme="green"
                    _hover={{ bg: 'green.700' }}
                    isDisabled={isActive}
                  >
                    Next Song
                  </Button>
                </HStack>

                {/* Answer Display */}
                {showAnswer && (
                  <SlideFade in={true} offsetY="20px">
                    <Box
                      bg="whiteAlpha.100"
                      p={4}
                      borderRadius="lg"
                      textAlign="center"
                      backdropFilter="blur(10px)"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                    >
                      <Text fontSize="lg" fontWeight="medium">
                        Song:{' '}
                        <Text as="span" color="purple.400">
                          {currentSong.answer}
                        </Text>
                      </Text>
                      {(isCorrect || !isActive) && (
                        <Text fontSize="md" color="whiteAlpha.800" mt={2}>
                          Original Lyrics:{' '}
                          <Text as="span" fontStyle="italic">
                            {currentSong.original_lyrics}
                          </Text>
                        </Text>
                      )}
                    </Box>
                  </SlideFade>
                )}
              </VStack>
            )}
          </VStack>
        )}
      </Container>
    </Box>
  );
}
